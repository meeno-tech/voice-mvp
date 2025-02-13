export interface ShareOption {
  id: string;
  title: string;
  icon: string;
  action: () => Promise<void>;
  color: string;
}

export interface Testimonial {
  text: string;
  author: string;
}

export interface Stats {
  activeUsers: string;
  rating: string;
}
