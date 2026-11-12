export interface Message {
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
  messages: Message[];
}

export interface MessageThreadProps {
  mode: 'doctor' | 'patient';
  patientId?: string;
}