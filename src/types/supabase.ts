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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          badge_id: string | null
          created_at: string
          description: string
          href: string | null
          id: string
          league_id: string | null
          match_id: string | null
          prediction_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          badge_id?: string | null
          created_at?: string
          description: string
          href?: string | null
          id?: string
          league_id?: string | null
          match_id?: string | null
          prediction_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          badge_id?: string | null
          created_at?: string
          description?: string
          href?: string | null
          id?: string
          league_id?: string | null
          match_id?: string | null
          prediction_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          description: string
          entity_id: string
          entity_type: string
          id: string
          severity: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          description: string
          entity_id: string
          entity_type: string
          id?: string
          severity: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          description?: string
          entity_id?: string
          entity_type?: string
          id?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_checklist_items: {
        Row: {
          created_at: string
          description: string
          id: string
          label: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id: string
          label: string
          sort_order?: number
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          label?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string
          description: string
          icon_path: string | null
          id: string
          name: string
          progress_target: number | null
          rarity: string
        }
        Insert: {
          category: string
          description: string
          icon_path?: string | null
          id: string
          name: string
          progress_target?: number | null
          rarity: string
        }
        Update: {
          category?: string
          description?: string
          icon_path?: string | null
          id?: string
          name?: string
          progress_target?: number | null
          rarity?: string
        }
        Relationships: []
      }
      daily_login_rewards: {
        Row: {
          created_at: string
          id: string
          points_awarded: number
          reward_date: string
          user_id: string
          week_start_date: string
          weekday: number
        }
        Insert: {
          created_at?: string
          id?: string
          points_awarded?: number
          reward_date: string
          user_id: string
          week_start_date: string
          weekday: number
        }
        Update: {
          created_at?: string
          id?: string
          points_awarded?: number
          reward_date?: string
          user_id?: string
          week_start_date?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_login_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      espn_match_event_participants: {
        Row: {
          event_key: string
          match_id: string
          player_id: string | null
          player_name: string
          role: string
          sort_order: number
        }
        Insert: {
          event_key: string
          match_id: string
          player_id?: string | null
          player_name: string
          role: string
          sort_order?: number
        }
        Update: {
          event_key?: string
          match_id?: string
          player_id?: string | null
          player_name?: string
          role?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "espn_match_event_participants_match_id_event_key_fkey"
            columns: ["match_id", "event_key"]
            isOneToOne: false
            referencedRelation: "espn_match_events"
            referencedColumns: ["match_id", "event_key"]
          },
          {
            foreignKeyName: "espn_match_event_participants_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "espn_players"
            referencedColumns: ["id"]
          },
        ]
      }
      espn_match_events: {
        Row: {
          away_score: number | null
          clock: string | null
          created_at: string
          espn_event_id: string | null
          event_index: number
          event_key: string
          event_type: string | null
          home_score: number | null
          match_id: string
          minute: number | null
          period: number | null
          scoring_play: boolean
          side: string | null
          source_payload: Json | null
          team_id: string | null
          text: string | null
          type_text: string | null
          updated_at: string
        }
        Insert: {
          away_score?: number | null
          clock?: string | null
          created_at?: string
          espn_event_id?: string | null
          event_index: number
          event_key: string
          event_type?: string | null
          home_score?: number | null
          match_id: string
          minute?: number | null
          period?: number | null
          scoring_play?: boolean
          side?: string | null
          source_payload?: Json | null
          team_id?: string | null
          text?: string | null
          type_text?: string | null
          updated_at?: string
        }
        Update: {
          away_score?: number | null
          clock?: string | null
          created_at?: string
          espn_event_id?: string | null
          event_index?: number
          event_key?: string
          event_type?: string | null
          home_score?: number | null
          match_id?: string
          minute?: number | null
          period?: number | null
          scoring_play?: boolean
          side?: string | null
          source_payload?: Json | null
          team_id?: string | null
          text?: string | null
          type_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "espn_match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "espn_match_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      espn_match_team_stats: {
        Row: {
          created_at: string
          display_value: string
          label: string
          match_id: string
          numeric_value: number | null
          side: string
          source_name: string | null
          stat_key: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_value: string
          label: string
          match_id: string
          numeric_value?: number | null
          side: string
          source_name?: string | null
          stat_key: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_value?: string
          label?: string
          match_id?: string
          numeric_value?: number | null
          side?: string
          source_name?: string | null
          stat_key?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "espn_match_team_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "espn_match_team_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      espn_player_tournament_stats: {
        Row: {
          assists: number
          goals: number
          latest_clock: string | null
          latest_match_id: string | null
          player_id: string
          player_name: string
          team_id: string
          updated_at: string
          yellow_cards: number
        }
        Insert: {
          assists?: number
          goals?: number
          latest_clock?: string | null
          latest_match_id?: string | null
          player_id: string
          player_name: string
          team_id: string
          updated_at?: string
          yellow_cards?: number
        }
        Update: {
          assists?: number
          goals?: number
          latest_clock?: string | null
          latest_match_id?: string | null
          player_id?: string
          player_name?: string
          team_id?: string
          updated_at?: string
          yellow_cards?: number
        }
        Relationships: [
          {
            foreignKeyName: "espn_player_tournament_stats_latest_match_id_fkey"
            columns: ["latest_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "espn_player_tournament_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "espn_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "espn_player_tournament_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      espn_players: {
        Row: {
          created_at: string
          display_name: string
          id: string
          normalized_name: string
          source: string
          source_player_id: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          normalized_name: string
          source?: string
          source_player_id?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          normalized_name?: string
          source?: string
          source_player_id?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "espn_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      espn_team_tournament_stats: {
        Row: {
          average_numeric: number | null
          label: string
          matches_sampled: number
          stat_key: string
          team_id: string
          total_numeric: number
          updated_at: string
        }
        Insert: {
          average_numeric?: number | null
          label: string
          matches_sampled?: number
          stat_key: string
          team_id: string
          total_numeric?: number
          updated_at?: string
        }
        Update: {
          average_numeric?: number | null
          label?: string
          matches_sampled?: number
          stat_key?: string
          team_id?: string
          total_numeric?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "espn_team_tournament_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_entries: {
        Row: {
          accuracy: number
          exact_scores: number
          id: string
          league_id: string | null
          points: number
          previous_rank: number | null
          rank: number
          scope: string
          streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy?: number
          exact_scores?: number
          id?: string
          league_id?: string | null
          points?: number
          previous_rank?: number | null
          rank: number
          scope: string
          streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy?: number
          exact_scores?: number
          id?: string
          league_id?: string | null
          points?: number
          previous_rank?: number | null
          rank?: number
          scope?: string
          streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      league_event_entries: {
        Row: {
          entered_at: string
          event_id: string
          stake: number
          user_id: string
        }
        Insert: {
          entered_at?: string
          event_id: string
          stake: number
          user_id: string
        }
        Update: {
          entered_at?: string
          event_id?: string
          stake?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_event_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "league_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_event_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      league_event_leaderboard_entries: {
        Row: {
          accuracy: number
          event_id: string
          exact_scores: number
          payout: number
          payout_factor: number
          point_split: number
          point_split_factor: number
          points: number
          previous_rank: number | null
          rank: number
          stake: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy?: number
          event_id: string
          exact_scores?: number
          payout?: number
          payout_factor?: number
          point_split?: number
          point_split_factor?: number
          points?: number
          previous_rank?: number | null
          rank: number
          stake?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy?: number
          event_id?: string
          exact_scores?: number
          payout?: number
          payout_factor?: number
          point_split?: number
          point_split_factor?: number
          points?: number
          previous_rank?: number | null
          rank?: number
          stake?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_event_leaderboard_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "league_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_event_leaderboard_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      league_event_matches: {
        Row: {
          created_at: string
          event_id: string
          match_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          match_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          match_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_event_matches_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "league_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_event_matches_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      league_events: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          ends_at: string
          event_type: string
          id: string
          league_id: string
          matchday: number | null
          max_stake: number
          metadata: Json
          min_stake: number
          name: string
          payout_config: Json
          payout_curve: string
          point_split_config: Json
          point_split_curve: string
          prize_pool: number
          recognition_pool: number
          settled_at: string | null
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          ends_at: string
          event_type: string
          id: string
          league_id: string
          matchday?: number | null
          max_stake?: number
          metadata?: Json
          min_stake?: number
          name: string
          payout_config?: Json
          payout_curve?: string
          point_split_config?: Json
          point_split_curve?: string
          prize_pool?: number
          recognition_pool?: number
          settled_at?: string | null
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          ends_at?: string
          event_type?: string
          id?: string
          league_id?: string
          matchday?: number | null
          max_stake?: number
          metadata?: Json
          min_stake?: number
          name?: string
          payout_config?: Json
          payout_curve?: string
          point_split_config?: Json
          point_split_curve?: string
          prize_pool?: number
          recognition_pool?: number
          settled_at?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_events_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_events_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      league_join_requests: {
        Row: {
          league_id: string
          requested_at: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          league_id: string
          requested_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          league_id?: string
          requested_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_join_requests_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_join_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_join_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      league_members: {
        Row: {
          joined_at: string
          league_id: string
          role: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          league_id: string
          role?: string
          user_id: string
        }
        Update: {
          joined_at?: string
          league_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_members_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          created_at: string
          creator_id: string | null
          description: string
          id: string
          invite_code: string
          join_policy: string
          member_count: number
          name: string
          prize_mode: string
          scoring_mode: string
          slug: string
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string
          id: string
          invite_code: string
          join_policy?: string
          member_count?: number
          name: string
          prize_mode?: string
          scoring_mode?: string
          slug: string
          status?: string
          updated_at?: string
          visibility: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string
          id?: string
          invite_code?: string
          join_policy?: string
          member_count?: number
          name?: string
          prize_mode?: string
          scoring_mode?: string
          slug?: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "leagues_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leagues_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string
          city: string
          espn_attendance: number | null
          espn_away_color: string | null
          espn_away_logo: string | null
          espn_away_record: string | null
          espn_away_win_pct: number | null
          espn_away_winner: boolean | null
          espn_competition_id: string | null
          espn_display_clock: string | null
          espn_draw_pct: number | null
          espn_event_id: string | null
          espn_home_color: string | null
          espn_home_logo: string | null
          espn_home_record: string | null
          espn_home_win_pct: number | null
          espn_home_winner: boolean | null
          espn_play_by_play_available: boolean | null
          espn_prediction_updated_at: string | null
          espn_state: string | null
          espn_stats_normalized_at: string | null
          espn_status: string | null
          espn_status_detail: string | null
          espn_summary: Json | null
          espn_summary_updated_at: string | null
          espn_updated_at: string | null
          group_code: string | null
          home_score: number | null
          home_team_id: string
          id: string
          kickoff_at: string
          lock_at: string
          matchday: number | null
          result_updated_at: string | null
          stadium: string
          stage: string
          status: string
        }
        Insert: {
          away_score?: number | null
          away_team_id: string
          city: string
          espn_attendance?: number | null
          espn_away_color?: string | null
          espn_away_logo?: string | null
          espn_away_record?: string | null
          espn_away_win_pct?: number | null
          espn_away_winner?: boolean | null
          espn_competition_id?: string | null
          espn_display_clock?: string | null
          espn_draw_pct?: number | null
          espn_event_id?: string | null
          espn_home_color?: string | null
          espn_home_logo?: string | null
          espn_home_record?: string | null
          espn_home_win_pct?: number | null
          espn_home_winner?: boolean | null
          espn_play_by_play_available?: boolean | null
          espn_prediction_updated_at?: string | null
          espn_state?: string | null
          espn_stats_normalized_at?: string | null
          espn_status?: string | null
          espn_status_detail?: string | null
          espn_summary?: Json | null
          espn_summary_updated_at?: string | null
          espn_updated_at?: string | null
          group_code?: string | null
          home_score?: number | null
          home_team_id: string
          id: string
          kickoff_at: string
          lock_at: string
          matchday?: number | null
          result_updated_at?: string | null
          stadium: string
          stage: string
          status: string
        }
        Update: {
          away_score?: number | null
          away_team_id?: string
          city?: string
          espn_attendance?: number | null
          espn_away_color?: string | null
          espn_away_logo?: string | null
          espn_away_record?: string | null
          espn_away_win_pct?: number | null
          espn_away_winner?: boolean | null
          espn_competition_id?: string | null
          espn_display_clock?: string | null
          espn_draw_pct?: number | null
          espn_event_id?: string | null
          espn_home_color?: string | null
          espn_home_logo?: string | null
          espn_home_record?: string | null
          espn_home_win_pct?: number | null
          espn_home_winner?: boolean | null
          espn_play_by_play_available?: boolean | null
          espn_prediction_updated_at?: string | null
          espn_state?: string | null
          espn_stats_normalized_at?: string | null
          espn_status?: string | null
          espn_status_detail?: string | null
          espn_summary?: Json | null
          espn_summary_updated_at?: string | null
          espn_updated_at?: string | null
          group_code?: string | null
          home_score?: number | null
          home_team_id?: string
          id?: string
          kickoff_at?: string
          lock_at?: string
          matchday?: number | null
          result_updated_at?: string | null
          stadium?: string
          stage?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_provider_aliases: {
        Row: {
          alias: string
          alias_key: string
          confidence: number
          created_at: string
          id: string
          normalized_alias: string
          player_id: string
          provider: string
          provider_player_id: string | null
          source: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          alias: string
          alias_key: string
          confidence?: number
          created_at?: string
          id?: string
          normalized_alias: string
          player_id: string
          provider: string
          provider_player_id?: string | null
          source?: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          alias?: string
          alias_key?: string
          confidence?: number
          created_at?: string
          id?: string
          normalized_alias?: string
          player_id?: string
          provider?: string
          provider_player_id?: string | null
          source?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_provider_aliases_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_provider_aliases_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          club: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string
          id: string
          image_url: string | null
          normalized_name: string
          primary_position: string | null
          primary_team_id: string | null
          slug: string
          source: string
          source_payload: Json | null
          source_player_name: string
          updated_at: string
        }
        Insert: {
          club?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name: string
          id: string
          image_url?: string | null
          normalized_name: string
          primary_position?: string | null
          primary_team_id?: string | null
          slug: string
          source?: string
          source_payload?: Json | null
          source_player_name: string
          updated_at?: string
        }
        Update: {
          club?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string
          id?: string
          image_url?: string | null
          normalized_name?: string
          primary_position?: string | null
          primary_team_id?: string | null
          slug?: string
          source?: string
          source_payload?: Json | null
          source_player_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_primary_team_id_fkey"
            columns: ["primary_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      point_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string
          event_id: string | null
          id: string
          league_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string
          event_id?: string | null
          id?: string
          league_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string
          event_id?: string | null
          id?: string
          league_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "league_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      point_wallets: {
        Row: {
          balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_scores: {
        Row: {
          calculated_at: string
          correct_outcome: number
          exact_score: number
          goal_difference_bonus: number
          outcome: string
          prediction_id: string
          risk_multiplier: number
          scoring_version: string
          streak_bonus: number
          team_score_bonus: number
          total: number
          underdog_bonus: number
        }
        Insert: {
          calculated_at?: string
          correct_outcome?: number
          exact_score?: number
          goal_difference_bonus?: number
          outcome: string
          prediction_id: string
          risk_multiplier?: number
          scoring_version: string
          streak_bonus?: number
          team_score_bonus?: number
          total?: number
          underdog_bonus?: number
        }
        Update: {
          calculated_at?: string
          correct_outcome?: number
          exact_score?: number
          goal_difference_bonus?: number
          outcome?: string
          prediction_id?: string
          risk_multiplier?: number
          scoring_version?: string
          streak_bonus?: number
          team_score_bonus?: number
          total?: number
          underdog_bonus?: number
        }
        Relationships: [
          {
            foreignKeyName: "prediction_scores_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: true
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          away_score: number | null
          confidence: number
          created_at: string
          home_score: number | null
          id: string
          is_risk_pick: boolean
          locked_at: string | null
          match_id: string
          predicted_outcome: string
          prediction_type: string
          revision: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          away_score?: number | null
          confidence?: number
          created_at?: string
          home_score?: number | null
          id?: string
          is_risk_pick?: boolean
          locked_at?: string | null
          match_id: string
          predicted_outcome: string
          prediction_type?: string
          revision?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          away_score?: number | null
          confidence?: number
          created_at?: string
          home_score?: number | null
          id?: string
          is_risk_pick?: boolean
          locked_at?: string | null
          match_id?: string
          predicted_outcome?: string
          prediction_type?: string
          revision?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accuracy: number | null
          avatar_url: string | null
          best_streak: number
          country_code: string | null
          created_at: string
          current_streak: number
          display_name: string | null
          email: string | null
          exact_scores: number
          fan_club_team_id: string | null
          id: string
          points: number
          rank: number | null
          role: string
          username: string
        }
        Insert: {
          accuracy?: number | null
          avatar_url?: string | null
          best_streak?: number
          country_code?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          email?: string | null
          exact_scores?: number
          fan_club_team_id?: string | null
          id: string
          points?: number
          rank?: number | null
          role?: string
          username: string
        }
        Update: {
          accuracy?: number | null
          avatar_url?: string | null
          best_streak?: number
          country_code?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          email?: string | null
          exact_scores?: number
          fan_club_team_id?: string | null
          id?: string
          points?: number
          rank?: number | null
          role?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_fan_club_team_id_fkey"
            columns: ["fan_club_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_eligibility_checks: {
        Row: {
          created_at: string
          description: string
          href: string | null
          id: string
          label: string
          sort_order: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          href?: string | null
          id: string
          label: string
          sort_order?: number
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          href?: string | null
          id?: string
          label?: string
          sort_order?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_eligibility_checks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_reviews: {
        Row: {
          amount: number
          currency: string
          id: string
          note: string
          period: string
          placement: string
          source: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          currency?: string
          id?: string
          note: string
          period: string
          placement: string
          source: string
          status: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          currency?: string
          id?: string
          note?: string
          period?: string
          placement?: string
          source?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_trust_notes: {
        Row: {
          created_at: string
          description: string
          id: string
          is_public: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id: string
          is_public?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_public?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          country_code: string
          fifa_rank: number | null
          group_code: string | null
          id: string
          name: string
          short_name: string
        }
        Insert: {
          country_code: string
          fifa_rank?: number | null
          group_code?: string | null
          id: string
          name: string
          short_name: string
        }
        Update: {
          country_code?: string
          fifa_rank?: number | null
          group_code?: string | null
          id?: string
          name?: string
          short_name?: string
        }
        Relationships: []
      }
      tournament_squad_players: {
        Row: {
          caps: number | null
          captain: boolean
          club: string | null
          coach_name: string | null
          created_at: string
          group_code: string | null
          international_goals: number | null
          player_id: string
          position: string
          source: string
          source_payload: Json | null
          source_scraped_at: string | null
          squad_number: number | null
          team_id: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          caps?: number | null
          captain?: boolean
          club?: string | null
          coach_name?: string | null
          created_at?: string
          group_code?: string | null
          international_goals?: number | null
          player_id: string
          position: string
          source?: string
          source_payload?: Json | null
          source_scraped_at?: string | null
          squad_number?: number | null
          team_id: string
          tournament_id?: string
          updated_at?: string
        }
        Update: {
          caps?: number | null
          captain?: boolean
          club?: string | null
          coach_name?: string | null
          created_at?: string
          group_code?: string | null
          international_goals?: number | null
          player_id?: string
          position?: string
          source?: string
          source_payload?: Json | null
          source_scraped_at?: string | null
          squad_number?: number | null
          team_id?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_squad_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_squad_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          progress_current: number
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          progress_current?: number
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          progress_current?: number
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_trust_signals: {
        Row: {
          created_at: string
          description: string
          id: string
          label: string
          severity: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id: string
          label: string
          severity: string
          status: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          label?: string
          severity?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_trust_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_daily_login_reward: {
        Args: { target_user_id: string }
        Returns: {
          already_claimed: boolean
          claimed: boolean
          points_awarded: number
          reward_date: string
          total_points: number
          week_start_date: string
          weekday: number
        }[]
      }
      cleanup_old_operational_data: { Args: never; Returns: Json }
      get_match_prediction_outcome_summary: {
        Args: { target_match_id: string }
        Returns: {
          away_predictions: number
          draw_predictions: number
          home_predictions: number
          match_id: string
          total_predictions: number
        }[]
      }
      get_public_user_prediction_history: {
        Args: { row_limit?: number; target_user_id: string }
        Returns: {
          match_away_score: number
          match_away_team_id: string
          match_city: string
          match_espn_display_clock: string
          match_espn_state: string
          match_espn_status: string
          match_espn_status_detail: string
          match_group_code: string
          match_home_score: number
          match_home_team_id: string
          match_kickoff_at: string
          match_lock_at: string
          match_matchday: number
          match_result_updated_at: string
          match_stadium: string
          match_stage: string
          match_status: string
          prediction_away_score: number
          prediction_confidence: number
          prediction_created_at: string
          prediction_home_score: number
          prediction_id: string
          prediction_is_risk_pick: boolean
          prediction_locked_at: string
          prediction_match_id: string
          prediction_predicted_outcome: string
          prediction_revision: number
          prediction_status: string
          prediction_type: string
          prediction_updated_at: string
          profile_accuracy: number
          profile_avatar_url: string
          profile_best_streak: number
          profile_country_code: string
          profile_created_at: string
          profile_current_streak: number
          profile_display_name: string
          profile_exact_scores: number
          profile_fan_club_team_id: string
          profile_id: string
          profile_points: number
          profile_rank: number
          profile_username: string
          score_calculated_at: string
          score_correct_outcome: number
          score_exact_score: number
          score_goal_difference_bonus: number
          score_outcome: string
          score_risk_multiplier: number
          score_scoring_version: string
          score_streak_bonus: number
          score_team_score_bonus: number
          score_total: number
          score_underdog_bonus: number
        }[]
      }
      refresh_global_leaderboard_entries: { Args: never; Returns: undefined }
      refresh_league_member_count: {
        Args: { target_league_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
