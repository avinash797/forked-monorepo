import { Database } from './database.types';

export type BadgeDefinition =
    Database['public']['Tables']['badge_definitions']['Row'];

export type UserBadge = Database['public']['Tables']['user_badges']['Row'];

export type UserBadgeWithDefinition = UserBadge & {
    slug: string,
    name: string,
    description: string,
    image_url: string,
    category: string,
    dish_type_id: string,
    threshold: number,
    is_active: boolean,
    is_featured: boolean,
    sort_order: number,
};

export interface NewBadgeAward {
    id: string;
    slug: string;
    name: string;
    description: string;
    image_url: string;
}
