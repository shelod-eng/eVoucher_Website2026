import { NextRequest, NextResponse } from 'next/server';
import {
  processPayment,
  getAvailablePaymentMethods,
  calculateFee,
  type PaymentRequest,
} from '@/server/services/inclusive-payment-gateway';

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json();

    if (!body.amount || !body.method || !body.productId || !body.userId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, method, productId, userId' },
        { status: 400 }
      );
    }

    const result = await processPayment(body);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Payment processing failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = Number(searchParams.get('amount') || 0);
    const hasInternet = searchParams.get('hasInternet') === 'true';
    const hasSmartphone = searchParams.get('hasSmartphone') === 'true';
    const language = searchParams.get('language') || 'en';

    const methods = getAvailablePaymentMethods(amount, hasInternet, hasSmartphone, language);

    const methodsWithFees = methods.map((method) => ({
      ...method,
      fee: calculateFee(amount, method.method),
      totalAmount: amount + calculateFee(amount, method.method),
    }));

    return NextResponse.json({
      success: true,
      amount,
      methods: methodsWithFees,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}
