export class ConfirmServiceCompletionDto {
  actorId: string; // ID of the tenant or provider confirming
  role: 'tenant' | 'provider';
}
