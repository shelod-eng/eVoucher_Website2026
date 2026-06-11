# Expo Mobile Document Upload Integration

Date: 2026-06-11
Scope: EV-TECH-DOC-001 mobile extension for merchant FICA/KYB evidence capture

The web platform now supports mobile-friendly PWA uploads at `/merchant/compliance`. If an Expo app is added, use this implementation contract so the native flow posts to the same hardened backend endpoint:

- API endpoint: `POST /api/v1/merchant/compliance/upload`
- Body: `multipart/form-data`
- Fields: `documentType`, `file`
- Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`
- Maximum upload size: 10MB
- Server storage: private Supabase bucket `merchant-compliance-documents`

## Dependencies

```powershell
npx expo install expo-document-picker expo-image-picker expo-image-manipulator
npm install axios
```

## Upload Service

Create `mobile/src/services/pick-and-upload-document.ts` in the Expo project:

```ts
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import axios from 'axios';

const MAX_BYTES = 10 * 1024 * 1024;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export type MerchantDocumentType =
  | 'FICA_ID'
  | 'FICA_POA'
  | 'CIPC_CERTIFICATE'
  | 'SARS_TAX_CLEARANCE'
  | 'EFT_MANDATE'
  | 'AML_DECLARATION'
  | 'POPIA_CONSENT'
  | 'BANK_STATEMENT';

function assertFileSize(size?: number | null) {
  if (typeof size === 'number' && size > MAX_BYTES) {
    throw new Error('File exceeds the 10MB upload limit.');
  }
}

async function normalizeImage(uri: string) {
  return ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 2048 } }],
    {
      compress: 0.88,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );
}

export async function pickDocumentFile() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled) return null;
  const asset = result.assets[0];
  assertFileSize(asset.size);

  if (/heic|heif|png|webp|jpeg|jpg/i.test(asset.mimeType ?? asset.name)) {
    const normalized = await normalizeImage(asset.uri);
    return {
      uri: normalized.uri,
      name: asset.name.replace(/\.(heic|heif|png|webp)$/i, '.jpg'),
      type: 'image/jpeg',
    };
  }

  return {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType ?? 'application/pdf',
  };
}

export async function captureDocumentImage() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Camera permission is required to capture documents.');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 0.9,
  });

  if (result.canceled) return null;
  const asset = result.assets[0];
  assertFileSize(asset.fileSize);
  const normalized = await normalizeImage(asset.uri);

  return {
    uri: normalized.uri,
    name: `merchant-document-${Date.now()}.jpg`,
    type: 'image/jpeg',
  };
}

export async function uploadMerchantDocument(params: {
  documentType: MerchantDocumentType;
  file: { uri: string; name: string; type: string };
  accessToken: string;
  onProgress?: (progress: number) => void;
}) {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not configured.');
  }

  const formData = new FormData();
  formData.append('documentType', params.documentType);
  formData.append('file', params.file as any);

  const response = await axios.post(`${API_BASE_URL}/api/v1/merchant/compliance/upload`, formData, {
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (event) => {
      if (!event.total || !params.onProgress) return;
      params.onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });

  return response.data;
}
```

## Screen Requirements

`DocumentUploadScreen.tsx` should:

- Render the same required document list as the web compliance page.
- Offer two actions per document: `Pick file` and `Camera`.
- Show status badges: Pending, Approved, Rejected.
- Show reviewer notes when rejected.
- Change the upload button label to `Resubmit` after rejection.
- Retry transient network failures and preserve upload progress by document type.

## Release Gate

- No service role keys in the Expo app.
- Native app must authenticate merchants and pass a normal access token.
- HEIC and camera images must be converted to JPEG before upload.
- Longest image edge must be 2048px.
- Server validation remains authoritative.
