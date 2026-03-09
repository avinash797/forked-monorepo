import { Database } from './database.types';

export type BadgeDefinition =
    Database['public']['Tables']['badge_definitions']['Row'];

export type UserBadge = Database['public']['Tables']['user_badges']['Row'];

export interface NewBadgeAward {
    id: string;
    slug: string;
    name: string;
    description: string;
    image_url: string;
}
