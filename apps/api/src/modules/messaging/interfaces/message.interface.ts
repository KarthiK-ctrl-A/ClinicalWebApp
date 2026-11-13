export interface MessageRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface MessageResponse {
  id: string;
  patientId: string;
  doctorId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface Conversation {
  patientId: string;
  doctorId: string;
}

export interface ConversationResponse extends Conversation {
  messages: MessageResponse[];
}
