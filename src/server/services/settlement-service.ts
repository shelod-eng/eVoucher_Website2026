export interface SettlementQueueResult {
  queuedPayouts: number;
}

export interface SettlementReconcileResult {
  reconciledPayouts: number;
}

export interface SettlementService {
  queuePayouts(): Promise<SettlementQueueResult>;
  reconcilePayouts(): Promise<SettlementReconcileResult>;
}
