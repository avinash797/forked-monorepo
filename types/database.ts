export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      charms: {
        Row: {
          created_at: string
          description: string
          display_order: number
          icon_svg: string | null
          icon_url: string | null
          id: string
          is_active: boolean
          name: string
          rarity_tier: string
          unlock_criteria: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          icon_svg?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          rarity_tier: string
          unlock_criteria: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          icon_svg?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          rarity_tier?: string
          unlock_criteria?: Json
          updated_at?: string
        }
        Relationships: []
      }
      dish_types: {
        Row: {
          alternate_names: string[] | null
          category: string
          common_dietary_tags: string[] | null
          created_at: string
          created_by_user_id: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          alternate_names?: string[] | null
          category: string
          common_dietary_tags?: string[] | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          alternate_names?: string[] | null
          category?: string
          common_dietary_tags?: string[] | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      dishes: {
        Row: {
          added_by_user_id: string | null
          average_rating: number | null
          category: string
          comparison_count: number | null
          currency: string
          current_price: number | null
          date_added: string
          description: string | null
          dietary_tags: string[] | null
          dish_type_id: string | null
          elo_rating: number | null
          embedding: string | null
          id: string
          is_available: boolean
          name: string
          photos: string[] | null
          review_count: number
          spice_level: number | null
          tags: string[] | null
          updated_at: string
          variety: string | null
          venue_id: string
        }
        Insert: {
          added_by_user_id?: string | null
          average_rating?: number | null
          category: string
          comparison_count?: number | null
          currency?: string
          current_price?: number | null
          date_added?: string
          description?: string | null
          dietary_tags?: string[] | null
          dish_type_id?: string | null
          elo_rating?: number | null
          embedding?: string | null
          id?: string
          is_available?: boolean
          name: string
          photos?: string[] | null
          review_count?: number
          spice_level?: number | null
          tags?: string[] | null
          updated_at?: string
          variety?: string | null
          venue_id: string
        }
        Update: {
          added_by_user_id?: string | null
          average_rating?: number | null
          category?: string
          comparison_count?: number | null
          currency?: string
          current_price?: number | null
          date_added?: string
          description?: string | null
          dietary_tags?: string[] | null
          dish_type_id?: string | null
          elo_rating?: number | null
          embedding?: string | null
          id?: string
          is_available?: boolean
          name?: string
          photos?: string[] | null
          review_count?: number
          spice_level?: number | null
          tags?: string[] | null
          updated_at?: string
          variety?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dishes_dish_type_id_fkey"
            columns: ["dish_type_id"]
            isOneToOne: false
            referencedRelation: "dish_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dishes_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      helpful_votes: {
        Row: {
          review_id: string
          user_id: string
          vote_value: number
          voted_at: string
        }
        Insert: {
          review_id: string
          user_id: string
          vote_value?: number
          voted_at?: string
        }
        Update: {
          review_id?: string
          user_id?: string
          vote_value?: number
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          ai_confidence_score: number | null
          ai_detected_dish_type: string | null
          display_order: number
          entity_id: string
          entity_type: string
          exif_data: Json
          file_size_bytes: number | null
          flagged_reason: string | null
          height: number | null
          id: string
          mime_type: string | null
          moderation_status: string
          storage_path: string
          uploaded_at: string
          uploaded_by_user_id: string
          url: string
          width: number | null
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_detected_dish_type?: string | null
          display_order?: number
          entity_id: string
          entity_type: string
          exif_data?: Json
          file_size_bytes?: number | null
          flagged_reason?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          moderation_status?: string
          storage_path: string
          uploaded_at?: string
          uploaded_by_user_id: string
          url: string
          width?: number | null
        }
        Update: {
          ai_confidence_score?: number | null
          ai_detected_dish_type?: string | null
          display_order?: number
          entity_id?: string
          entity_type?: string
          exif_data?: Json
          file_size_bytes?: number | null
          flagged_reason?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          moderation_status?: string
          storage_path?: string
          uploaded_at?: string
          uploaded_by_user_id?: string
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      price_history: {
        Row: {
          created_at: string
          currency: string
          dish_id: string
          id: string
          is_verified: boolean
          notes: string | null
          price: number
          recorded_at: string
          reported_by_user_id: string | null
          source: string
          verified_at: string | null
          verified_by_user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          dish_id: string
          id?: string
          is_verified?: boolean
          notes?: string | null
          price: number
          recorded_at?: string
          reported_by_user_id?: string | null
          source: string
          verified_at?: string | null
          verified_by_user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          dish_id?: string
          id?: string
          is_verified?: boolean
          notes?: string | null
          price?: number
          recorded_at?: string
          reported_by_user_id?: string | null
          source?: string
          verified_at?: string | null
          verified_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          dish_id: string
          edit_history: Json
          flagged_reason: string | null
          helpful_votes_count: number
          id: string
          is_gps_verified: boolean
          is_photo_verified: boolean
          location_latitude: number | null
          location_longitude: number | null
          moderation_status: string
          needs_human_review: boolean
          photo_urls: string[] | null
          rating: number
          review_text: string | null
          updated_at: string
          user_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          dish_id: string
          edit_history?: Json
          flagged_reason?: string | null
          helpful_votes_count?: number
          id?: string
          is_gps_verified?: boolean
          is_photo_verified?: boolean
          location_latitude?: number | null
          location_longitude?: number | null
          moderation_status?: string
          needs_human_review?: boolean
          photo_urls?: string[] | null
          rating: number
          review_text?: string | null
          updated_at?: string
          user_id: string
          venue_id: string
        }
        Update: {
          created_at?: string
          dish_id?: string
          edit_history?: Json
          flagged_reason?: string | null
          helpful_votes_count?: number
          id?: string
          is_gps_verified?: boolean
          is_photo_verified?: boolean
          location_latitude?: number | null
          location_longitude?: number | null
          moderation_status?: string
          needs_human_review?: boolean
          photo_urls?: string[] | null
          rating?: number
          review_text?: string | null
          updated_at?: string
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      user_charms: {
        Row: {
          charm_id: string
          is_featured: boolean
          progress: Json
          unlocked_at: string
          user_id: string
        }
        Insert: {
          charm_id: string
          is_featured?: boolean
          progress?: Json
          unlocked_at?: string
          user_id: string
        }
        Update: {
          charm_id?: string
          is_featured?: boolean
          progress?: Json
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_charms_charm_id_fkey"
            columns: ["charm_id"]
            isOneToOne: false
            referencedRelation: "charms"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          charms: Json
          created_at: string
          display_name: string | null
          email: string
          email_verified: boolean
          id: string
          location: string | null
          phone_verified: boolean
          reputation_score: number
          taste_profile: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          charms?: Json
          created_at?: string
          display_name?: string | null
          email: string
          email_verified?: boolean
          id: string
          location?: string | null
          phone_verified?: boolean
          reputation_score?: number
          taste_profile?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          charms?: Json
          created_at?: string
          display_name?: string | null
          email?: string
          email_verified?: boolean
          id?: string
          location?: string | null
          phone_verified?: boolean
          reputation_score?: number
          taste_profile?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      venues: {
        Row: {
          added_by_user_id: string | null
          address_city: string
          address_country: string
          address_state: string
          address_street: string
          address_zip: string
          created_at: string
          cuisine_types: string[]
          google_place_id: string | null
          hours_of_operation: Json
          id: string
          is_chain: boolean
          is_verified: boolean | null
          latitude: number | null
          location: unknown
          longitude: number | null
          name: string
          parent_chain_id: string | null
          photos: string[] | null
          price_range: number | null
          updated_at: string
        }
        Insert: {
          added_by_user_id?: string | null
          address_city: string
          address_country?: string
          address_state: string
          address_street: string
          address_zip: string
          created_at?: string
          cuisine_types?: string[]
          google_place_id?: string | null
          hours_of_operation?: Json
          id?: string
          is_chain?: boolean
          is_verified?: boolean | null
          latitude?: number | null
          location?: unknown
          longitude?: number | null
          name: string
          parent_chain_id?: string | null
          photos?: string[] | null
          price_range?: number | null
          updated_at?: string
        }
        Update: {
          added_by_user_id?: string | null
          address_city?: string
          address_country?: string
          address_state?: string
          address_street?: string
          address_zip?: string
          created_at?: string
          cuisine_types?: string[]
          google_place_id?: string | null
          hours_of_operation?: Json
          id?: string
          is_chain?: boolean
          is_verified?: boolean | null
          latitude?: number | null
          location?: unknown
          longitude?: number | null
          name?: string
          parent_chain_id?: string | null
          photos?: string[] | null
          price_range?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_parent_chain_id_fkey"
            columns: ["parent_chain_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
      | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
      | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
      | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
      | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
      | {
        Args: {
          catalog_name: string
          column_name: string
          new_dim: number
          new_srid_in: number
          new_type: string
          schema_name: string
          table_name: string
          use_typmod?: boolean
        }
        Returns: string
      }
      | {
        Args: {
          column_name: string
          new_dim: number
          new_srid: number
          new_type: string
          schema_name: string
          table_name: string
          use_typmod?: boolean
        }
        Returns: string
      }
      | {
        Args: {
          column_name: string
          new_dim: number
          new_srid: number
          new_type: string
          table_name: string
          use_typmod?: boolean
        }
        Returns: string
      }
      check_and_grant_charms: { Args: { p_user_id: string }; Returns: number }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
      | {
        Args: {
          catalog_name: string
          column_name: string
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      | {
        Args: {
          column_name: string
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
      | {
        Args: {
          catalog_name: string
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      | { Args: { schema_name: string; table_name: string }; Returns: string }
      | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      evaluate_user_charms: { Args: { p_user_id: string }; Returns: number }
      find_dishes_by_type: {
        Args: { p_city?: string; p_dish_type_id: string; p_limit?: number }
        Returns: {
          currency: string
          current_price: number
          dish_id: string
          dish_name: string
          is_available: boolean
          venue_city: string
          venue_id: string
          venue_name: string
        }[]
      }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_current_dish_price: { Args: { p_dish_id: string }; Returns: number }
      get_entity_photos: {
        Args: { p_entity_id: string; p_entity_type: string; p_limit?: number }
        Returns: {
          display_order: number
          height: number
          photo_id: string
          uploaded_at: string
          uploaded_by_user_id: string
          url: string
          width: number
        }[]
      }
      get_helpful_reviews: {
        Args: { p_dish_id: string; p_limit?: number }
        Returns: {
          created_at: string
          helpful_votes_count: number
          rating: number
          review_id: string
          review_text: string
          user_id: string
        }[]
      }
      get_top_helpful_reviews: {
        Args: { p_dish_id: string; p_limit?: number }
        Returns: {
          created_at: string
          helpful_votes_count: number
          review_id: string
          review_text: string
          star_rating: number
          user_id: string
        }[]
      }
      get_user_charms: {
        Args: { p_user_id: string }
        Returns: {
          charm_description: string
          charm_icon_url: string
          charm_id: string
          charm_name: string
          is_featured: boolean
          rarity_tier: string
          unlocked_at: string
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      grant_charm: {
        Args: { p_charm_id: string; p_user_id: string }
        Returns: boolean
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
      | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
      | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
      | { Args: { line1: unknown; line2: unknown }; Returns: number }
      | {
        Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
        Returns: number
      }
      st_area:
      | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
      | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
      | {
        Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      | {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      | {
        Args: {
          geom_column?: string
          maxdecimaldigits?: number
          pretty_bool?: boolean
          r: Record<string, unknown>
        }
        Returns: string
      }
      | { Args: { "": string }; Returns: string }
      st_asgml:
      | {
        Args: {
          geog: unknown
          id?: string
          maxdecimaldigits?: number
          nprefix?: string
          options?: number
        }
        Returns: string
      }
      | {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      | { Args: { "": string }; Returns: string }
      | {
        Args: {
          geog: unknown
          id?: string
          maxdecimaldigits?: number
          nprefix?: string
          options?: number
          version: number
        }
        Returns: string
      }
      | {
        Args: {
          geom: unknown
          id?: string
          maxdecimaldigits?: number
          nprefix?: string
          options?: number
          version: number
        }
        Returns: string
      }
      st_askml:
      | {
        Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
        Returns: string
      }
      | {
        Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
        Returns: string
      }
      | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
      | {
        Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
        Returns: string
      }
      | {
        Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
        Returns: string
      }
      | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
      | {
        Args: {
          geom: unknown
          prec?: number
          prec_m?: number
          prec_z?: number
          with_boxes?: boolean
          with_sizes?: boolean
        }
        Returns: string
      }
      | {
        Args: {
          geom: unknown[]
          ids: number[]
          prec?: number
          prec_m?: number
          prec_z?: number
          with_boxes?: boolean
          with_sizes?: boolean
        }
        Returns: string
      }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
      | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
      | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
      | {
        Args: { geom: unknown; options?: string; radius: number }
        Returns: unknown
      }
      | {
        Args: { geom: unknown; quadsegs: number; radius: number }
        Returns: unknown
      }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
      | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
      | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
      | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
      | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
      | {
        Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
        Returns: number
      }
      | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
      | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      | {
        Args: { geom1: unknown; geom2: unknown; radius: number }
        Returns: number
      }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
      | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
      | {
        Args: { box: unknown; dx: number; dy: number; dz?: number }
        Returns: unknown
      }
      | {
        Args: {
          dm?: number
          dx: number
          dy: number
          dz?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
      | { Args: { area: unknown; npoints: number }; Returns: unknown }
      | {
        Args: { area: unknown; npoints: number; seed: number }
        Returns: unknown
      }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
      | { Args: { geog: unknown; maxchars?: number }; Returns: string }
      | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
      | { Args: { "": Json }; Returns: unknown }
      | { Args: { "": Json }; Returns: unknown }
      | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
      | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
      | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
      | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
      | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
      | { Args: { geog: unknown; srid: number }; Returns: unknown }
      | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
      | { Args: { geog: unknown }; Returns: number }
      | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
      | {
        Args: { from_proj: string; geom: unknown; to_proj: string }
        Returns: unknown
      }
      | {
        Args: { from_proj: string; geom: unknown; to_srid: number }
        Returns: unknown
      }
      | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
      | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      | {
        Args: { geom1: unknown; geom2: unknown; gridsize: number }
        Returns: unknown
      }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      user_voted_helpful: {
        Args: { p_review_id: string; p_user_id: string }
        Returns: boolean
      }
      verify_review_gps: {
        Args: { p_max_distance_meters?: number; p_review_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
