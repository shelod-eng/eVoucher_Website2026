import { createAdminClient } from '@/lib/supabase/admin';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function sseEvent(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: Request) {
  const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);
  if (!allowed) return new Response('Forbidden', { status: 403 });

  const { searchParams } = new URL(request.url);
  const jobId = String(searchParams.get('jobId') ?? '').trim();
  if (!jobId) return new Response('jobId is required', { status: 400 });

  const admin = createAdminClient();
  const { data: runRow } = await admin
    .from('billing_engine_runs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const log = Array.isArray((runRow as any)?.log) ? ((runRow as any).log as any[]) : [];
      if (log.length === 0) {
        controller.enqueue(
          encoder.encode(
            sseEvent({
              step: 0,
              status: (runRow as any)?.status ?? 'unknown',
              message: 'No engine logs available.',
            })
          )
        );
        controller.close();
        return;
      }

      log.forEach((entry) => controller.enqueue(encoder.encode(sseEvent(entry))));
      controller.enqueue(
        encoder.encode(
          sseEvent({
            step: 999,
            status: (runRow as any)?.status ?? 'unknown',
            message: 'stream_complete',
          })
        )
      );
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
