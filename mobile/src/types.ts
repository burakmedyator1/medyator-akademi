export type Course = {
  id: number;
  title: string;
  category: string;
  deliveryType: string;
  description?: string;
  coverColor?: string;
  coverImageUrl?: string | null;
  price?: number;
  displayOrder?: number;
  instructorId?: number;
  instructorName?: string;
  instructorTitle?: string;
  instructorPhotoUrl?: string | null;
  instructorAvatarColor?: string;
  lessonCount?: number;
  lessons?: Lesson[];
};

export type Lesson = {
  id: number;
  title: string;
  description?: string;
  durationMinutes?: number;
  order_?: number;
  isPreview?: boolean;
};

export type Enrollment = {
  progress: number;
  paymentStatus: 'pending' | 'approved' | 'rejected';
};
