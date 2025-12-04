export class ConfirmServiceCompletionDto {
  actorId: string; // ID of the student or provider confirming
  role: 'student' | 'provider';
}
