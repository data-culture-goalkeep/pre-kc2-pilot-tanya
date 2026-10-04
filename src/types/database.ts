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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      beneficiaries: {
        Row: {
          address: string | null
          age: number | null
          beneficiary_id: string
          current_status_life_goals: string | null
          date_of_birth: string | null
          doubt_from_goalkeep: string | null
          exit_date: string | null
          family_members: string | null
          family_occupation: string | null
          financially_independent: string | null
          gender: string | null
          hfh_comments: string | null
          hospital: Database["public"]["Enums"]["hospital_enum"] | null
          interested_in_daycare_program: string | null
          job_description: string | null
          level_of_care: string | null
          life_goals_discontinued_date: string | null
          location: string | null
          name_of_child: string | null
          notes: string | null
          primary_diagnosis: string | null
          primary_mobile_no: string | null
          program: Database["public"]["Enums"]["program_enum"] | null
          registration_date: string | null
          salary_per_month: number | null
          secondary_mobile_no: string | null
          source_file: string
          source_row: number
          source_sheet: string
          source_used: string | null
          status: Database["public"]["Enums"]["status_enum"] | null
          sub_diagnosis: string | null
          verification_from_goalkeep: boolean | null
          verification_from_hfh: boolean | null
          ward_department: Database["public"]["Enums"]["ward_enum"] | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          beneficiary_id: string
          current_status_life_goals?: string | null
          date_of_birth?: string | null
          doubt_from_goalkeep?: string | null
          exit_date?: string | null
          family_members?: string | null
          family_occupation?: string | null
          financially_independent?: string | null
          gender?: string | null
          hfh_comments?: string | null
          hospital?: Database["public"]["Enums"]["hospital_enum"] | null
          interested_in_daycare_program?: string | null
          job_description?: string | null
          level_of_care?: string | null
          life_goals_discontinued_date?: string | null
          location?: string | null
          name_of_child?: string | null
          notes?: string | null
          primary_diagnosis?: string | null
          primary_mobile_no?: string | null
          program?: Database["public"]["Enums"]["program_enum"] | null
          registration_date?: string | null
          salary_per_month?: number | null
          secondary_mobile_no?: string | null
          source_file: string
          source_row: number
          source_sheet: string
          source_used?: string | null
          status?: Database["public"]["Enums"]["status_enum"] | null
          sub_diagnosis?: string | null
          verification_from_goalkeep?: boolean | null
          verification_from_hfh?: boolean | null
          ward_department?: Database["public"]["Enums"]["ward_enum"] | null
        }
        Update: {
          address?: string | null
          age?: number | null
          beneficiary_id?: string
          current_status_life_goals?: string | null
          date_of_birth?: string | null
          doubt_from_goalkeep?: string | null
          exit_date?: string | null
          family_members?: string | null
          family_occupation?: string | null
          financially_independent?: string | null
          gender?: string | null
          hfh_comments?: string | null
          hospital?: Database["public"]["Enums"]["hospital_enum"] | null
          interested_in_daycare_program?: string | null
          job_description?: string | null
          level_of_care?: string | null
          life_goals_discontinued_date?: string | null
          location?: string | null
          name_of_child?: string | null
          notes?: string | null
          primary_diagnosis?: string | null
          primary_mobile_no?: string | null
          program?: Database["public"]["Enums"]["program_enum"] | null
          registration_date?: string | null
          salary_per_month?: number | null
          secondary_mobile_no?: string | null
          source_file?: string
          source_row?: number
          source_sheet?: string
          source_used?: string | null
          status?: Database["public"]["Enums"]["status_enum"] | null
          sub_diagnosis?: string | null
          verification_from_goalkeep?: boolean | null
          verification_from_hfh?: boolean | null
          ward_department?: Database["public"]["Enums"]["ward_enum"] | null
        }
        Relationships: []
      }
      daycare_attendance: {
        Row: {
          attendance_id: string
          beneficiary_id: string
          day_01: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_02: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_03: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_04: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_05: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_06: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_07: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_08: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_09: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_10: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_11: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_12: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_13: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_14: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_15: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_16: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_17: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_18: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_19: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_20: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_21: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_22: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_23: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_24: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_25: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_26: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_27: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_28: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_29: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_30: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_31: Database["public"]["Enums"]["attendance_code_enum"] | null
          doubt_from_goalkeep: string | null
          financial_year: string | null
          had_access_to_4_meals_a_day: boolean | null
          hfh_comments: string | null
          month: Database["public"]["Enums"]["month_enum"] | null
          name_of_child: string | null
          notes: string | null
          source_file: string
          source_row: number
          source_sheet: string
          source_used: string | null
          total_present: number | null
          verification_from_goalkeep: boolean | null
          verification_from_hfh: boolean | null
        }
        Insert: {
          attendance_id?: string
          beneficiary_id: string
          day_01?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_02?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_03?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_04?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_05?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_06?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_07?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_08?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_09?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_10?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_11?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_12?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_13?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_14?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_15?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_16?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_17?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_18?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_19?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_20?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_21?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_22?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_23?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_24?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_25?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_26?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_27?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_28?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_29?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_30?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_31?: Database["public"]["Enums"]["attendance_code_enum"] | null
          doubt_from_goalkeep?: string | null
          financial_year?: string | null
          had_access_to_4_meals_a_day?: boolean | null
          hfh_comments?: string | null
          month?: Database["public"]["Enums"]["month_enum"] | null
          name_of_child?: string | null
          notes?: string | null
          source_file: string
          source_row: number
          source_sheet: string
          source_used?: string | null
          total_present?: number | null
          verification_from_goalkeep?: boolean | null
          verification_from_hfh?: boolean | null
        }
        Update: {
          attendance_id?: string
          beneficiary_id?: string
          day_01?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_02?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_03?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_04?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_05?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_06?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_07?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_08?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_09?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_10?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_11?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_12?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_13?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_14?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_15?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_16?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_17?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_18?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_19?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_20?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_21?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_22?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_23?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_24?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_25?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_26?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_27?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_28?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_29?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_30?: Database["public"]["Enums"]["attendance_code_enum"] | null
          day_31?: Database["public"]["Enums"]["attendance_code_enum"] | null
          doubt_from_goalkeep?: string | null
          financial_year?: string | null
          had_access_to_4_meals_a_day?: boolean | null
          hfh_comments?: string | null
          month?: Database["public"]["Enums"]["month_enum"] | null
          name_of_child?: string | null
          notes?: string | null
          source_file?: string
          source_row?: number
          source_sheet?: string
          source_used?: string | null
          total_present?: number | null
          verification_from_goalkeep?: boolean | null
          verification_from_hfh?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "daycare_attendance_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "beneficiaries"
            referencedColumns: ["beneficiary_id"]
          },
        ]
      }
      daycare_quarterly: {
        Row: {
          basic_necessities: string | null
          beneficiary_id: string
          cd4_for_hiv_children: number | null
          celebration_exposure: string | null
          current_status_education: string | null
          daycare_quarterly_id: string
          diagnosis: string | null
          doubt_from_goalkeep: string | null
          educational_provided_required_date: string | null
          educational_support_required_date: string | null
          english_speaking_session: string | null
          exit_date: string | null
          extracurricular_activities: string | null
          extracurricular_support: string | null
          financial_year: string | null
          grocery_support_provided_date: string | null
          grocery_support_required_date: string | null
          height_in_cm: number | null
          hfh_comments: string | null
          home_schooling_tuition: string | null
          hospital_admissions_in_quarter: string | null
          intensive_intervention_psychiatric_medicines_provided_date:
            | string
            | null
          intensive_intervention_psychiatric_medicines_required_date:
            | string
            | null
          life_skill_empowerment_session_at_hfh: string | null
          life_status: Database["public"]["Enums"]["status_enum"] | null
          medicine_support_provided_date: string | null
          medicine_support_required_date: string | null
          name_of_child: string | null
          no_of_blood_transfusions_in_a_month: number | null
          notes: string | null
          one_to_one_therapy_provided_date: string | null
          one_to_one_therapy_required_date: string | null
          quarter: Database["public"]["Enums"]["quarter_enum"] | null
          school_college_fees_tuition: string | null
          source_file: string
          source_row: number
          source_sheet: string
          source_used: string | null
          verification_from_goalkeep: boolean | null
          verification_from_hfh: boolean | null
          viral_load_for_hiv: string | null
          weight_in_kg: number | null
        }
        Insert: {
          basic_necessities?: string | null
          beneficiary_id: string
          cd4_for_hiv_children?: number | null
          celebration_exposure?: string | null
          current_status_education?: string | null
          daycare_quarterly_id?: string
          diagnosis?: string | null
          doubt_from_goalkeep?: string | null
          educational_provided_required_date?: string | null
          educational_support_required_date?: string | null
          english_speaking_session?: string | null
          exit_date?: string | null
          extracurricular_activities?: string | null
          extracurricular_support?: string | null
          financial_year?: string | null
          grocery_support_provided_date?: string | null
          grocery_support_required_date?: string | null
          height_in_cm?: number | null
          hfh_comments?: string | null
          home_schooling_tuition?: string | null
          hospital_admissions_in_quarter?: string | null
          intensive_intervention_psychiatric_medicines_provided_date?:
            | string
            | null
          intensive_intervention_psychiatric_medicines_required_date?:
            | string
            | null
          life_skill_empowerment_session_at_hfh?: string | null
          life_status?: Database["public"]["Enums"]["status_enum"] | null
          medicine_support_provided_date?: string | null
          medicine_support_required_date?: string | null
          name_of_child?: string | null
          no_of_blood_transfusions_in_a_month?: number | null
          notes?: string | null
          one_to_one_therapy_provided_date?: string | null
          one_to_one_therapy_required_date?: string | null
          quarter?: Database["public"]["Enums"]["quarter_enum"] | null
          school_college_fees_tuition?: string | null
          source_file: string
          source_row: number
          source_sheet: string
          source_used?: string | null
          verification_from_goalkeep?: boolean | null
          verification_from_hfh?: boolean | null
          viral_load_for_hiv?: string | null
          weight_in_kg?: number | null
        }
        Update: {
          basic_necessities?: string | null
          beneficiary_id?: string
          cd4_for_hiv_children?: number | null
          celebration_exposure?: string | null
          current_status_education?: string | null
          daycare_quarterly_id?: string
          diagnosis?: string | null
          doubt_from_goalkeep?: string | null
          educational_provided_required_date?: string | null
          educational_support_required_date?: string | null
          english_speaking_session?: string | null
          exit_date?: string | null
          extracurricular_activities?: string | null
          extracurricular_support?: string | null
          financial_year?: string | null
          grocery_support_provided_date?: string | null
          grocery_support_required_date?: string | null
          height_in_cm?: number | null
          hfh_comments?: string | null
          home_schooling_tuition?: string | null
          hospital_admissions_in_quarter?: string | null
          intensive_intervention_psychiatric_medicines_provided_date?:
            | string
            | null
          intensive_intervention_psychiatric_medicines_required_date?:
            | string
            | null
          life_skill_empowerment_session_at_hfh?: string | null
          life_status?: Database["public"]["Enums"]["status_enum"] | null
          medicine_support_provided_date?: string | null
          medicine_support_required_date?: string | null
          name_of_child?: string | null
          no_of_blood_transfusions_in_a_month?: number | null
          notes?: string | null
          one_to_one_therapy_provided_date?: string | null
          one_to_one_therapy_required_date?: string | null
          quarter?: Database["public"]["Enums"]["quarter_enum"] | null
          school_college_fees_tuition?: string | null
          source_file?: string
          source_row?: number
          source_sheet?: string
          source_used?: string | null
          verification_from_goalkeep?: boolean | null
          verification_from_hfh?: boolean | null
          viral_load_for_hiv?: string | null
          weight_in_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daycare_quarterly_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "beneficiaries"
            referencedColumns: ["beneficiary_id"]
          },
        ]
      }
      homecare_monthly: {
        Row: {
          any_other_support_provided: string | null
          any_other_support_required: string | null
          beneficiary_id: string
          contact_number: string | null
          contact_type: Database["public"]["Enums"]["contact_type_enum"] | null
          diagnosis_illness: string | null
          doubt_from_goalkeep: string | null
          educational_support_provided_date: string | null
          educational_support_required_date: string | null
          exit_date: string | null
          financial_year: string | null
          grocery_support_provided_date: string | null
          grocery_support_required_date: string | null
          height_in_cm: number | null
          hfh_comments: string | null
          home_call_visit_date: string | null
          homecare_monthly_id: string
          life_status: Database["public"]["Enums"]["status_enum"] | null
          medicine_support_provided_date: string | null
          medicine_support_required_date: string | null
          month: Database["public"]["Enums"]["month_enum"] | null
          name_of_child: string | null
          notes: string | null
          source_file: string
          source_row: number
          source_sheet: string
          source_used: string | null
          therapist_social_worker_nurse: string | null
          verification_from_goalkeep: boolean | null
          verification_from_hfh: boolean | null
          weight_in_kg: number | null
        }
        Insert: {
          any_other_support_provided?: string | null
          any_other_support_required?: string | null
          beneficiary_id: string
          contact_number?: string | null
          contact_type?: Database["public"]["Enums"]["contact_type_enum"] | null
          diagnosis_illness?: string | null
          doubt_from_goalkeep?: string | null
          educational_support_provided_date?: string | null
          educational_support_required_date?: string | null
          exit_date?: string | null
          financial_year?: string | null
          grocery_support_provided_date?: string | null
          grocery_support_required_date?: string | null
          height_in_cm?: number | null
          hfh_comments?: string | null
          home_call_visit_date?: string | null
          homecare_monthly_id?: string
          life_status?: Database["public"]["Enums"]["status_enum"] | null
          medicine_support_provided_date?: string | null
          medicine_support_required_date?: string | null
          month?: Database["public"]["Enums"]["month_enum"] | null
          name_of_child?: string | null
          notes?: string | null
          source_file: string
          source_row: number
          source_sheet: string
          source_used?: string | null
          therapist_social_worker_nurse?: string | null
          verification_from_goalkeep?: boolean | null
          verification_from_hfh?: boolean | null
          weight_in_kg?: number | null
        }
        Update: {
          any_other_support_provided?: string | null
          any_other_support_required?: string | null
          beneficiary_id?: string
          contact_number?: string | null
          contact_type?: Database["public"]["Enums"]["contact_type_enum"] | null
          diagnosis_illness?: string | null
          doubt_from_goalkeep?: string | null
          educational_support_provided_date?: string | null
          educational_support_required_date?: string | null
          exit_date?: string | null
          financial_year?: string | null
          grocery_support_provided_date?: string | null
          grocery_support_required_date?: string | null
          height_in_cm?: number | null
          hfh_comments?: string | null
          home_call_visit_date?: string | null
          homecare_monthly_id?: string
          life_status?: Database["public"]["Enums"]["status_enum"] | null
          medicine_support_provided_date?: string | null
          medicine_support_required_date?: string | null
          month?: Database["public"]["Enums"]["month_enum"] | null
          name_of_child?: string | null
          notes?: string | null
          source_file?: string
          source_row?: number
          source_sheet?: string
          source_used?: string | null
          therapist_social_worker_nurse?: string | null
          verification_from_goalkeep?: boolean | null
          verification_from_hfh?: boolean | null
          weight_in_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "homecare_monthly_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "beneficiaries"
            referencedColumns: ["beneficiary_id"]
          },
        ]
      }
      hospital_children: {
        Row: {
          child_name: string
          hospital_child_id: string
          source_file: string
          source_row: number
          source_sheet: string
        }
        Insert: {
          child_name: string
          hospital_child_id?: string
          source_file: string
          source_row: number
          source_sheet: string
        }
        Update: {
          child_name?: string
          hospital_child_id?: string
          source_file?: string
          source_row?: number
          source_sheet?: string
        }
        Relationships: []
      }
      hospital_session_feedback: {
        Row: {
          activity_fun: string | null
          closure: string | null
          core_activity: string | null
          diagnosis: string | null
          facilitator: string | null
          feeling_during_activity: string | null
          feeling_on_entry: string | null
          felt_relaxed: string | null
          hospital_child_id: string
          hospital_name: Database["public"]["Enums"]["hospital_enum"] | null
          hospital_session_feedback_id: string
          notes: string | null
          ritual: string | null
          session_date: string | null
          source_file: string
          source_row: number
          source_sheet: string
          source_used: string | null
          ward: Database["public"]["Enums"]["ward_enum"] | null
          warm_up: string | null
          would_attend_again: string | null
        }
        Insert: {
          activity_fun?: string | null
          closure?: string | null
          core_activity?: string | null
          diagnosis?: string | null
          facilitator?: string | null
          feeling_during_activity?: string | null
          feeling_on_entry?: string | null
          felt_relaxed?: string | null
          hospital_child_id: string
          hospital_name?: Database["public"]["Enums"]["hospital_enum"] | null
          hospital_session_feedback_id?: string
          notes?: string | null
          ritual?: string | null
          session_date?: string | null
          source_file: string
          source_row: number
          source_sheet: string
          source_used?: string | null
          ward?: Database["public"]["Enums"]["ward_enum"] | null
          warm_up?: string | null
          would_attend_again?: string | null
        }
        Update: {
          activity_fun?: string | null
          closure?: string | null
          core_activity?: string | null
          diagnosis?: string | null
          facilitator?: string | null
          feeling_during_activity?: string | null
          feeling_on_entry?: string | null
          felt_relaxed?: string | null
          hospital_child_id?: string
          hospital_name?: Database["public"]["Enums"]["hospital_enum"] | null
          hospital_session_feedback_id?: string
          notes?: string | null
          ritual?: string | null
          session_date?: string | null
          source_file?: string
          source_row?: number
          source_sheet?: string
          source_used?: string | null
          ward?: Database["public"]["Enums"]["ward_enum"] | null
          warm_up?: string | null
          would_attend_again?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hospital_session_feedback_hospital_child_id_fkey"
            columns: ["hospital_child_id"]
            isOneToOne: false
            referencedRelation: "hospital_children"
            referencedColumns: ["hospital_child_id"]
          },
        ]
      }
      rosenberg_assessment_history: {
        Row: {
          assessment_date: string | null
          beneficiary_id: string
          doubt_from_goalkeep: string | null
          hfh_comments: string | null
          name_of_child: string | null
          notes: string | null
          q1_raw: string | null
          q1_value: number | null
          q10_raw: string | null
          q10_value: number | null
          q2_raw: string | null
          q2_value: number | null
          q3_raw: string | null
          q3_value: number | null
          q4_raw: string | null
          q4_value: number | null
          q5_raw: string | null
          q5_value: number | null
          q6_raw: string | null
          q6_value: number | null
          q7_raw: string | null
          q7_value: number | null
          q8_raw: string | null
          q8_value: number | null
          q9_raw: string | null
          q9_value: number | null
          rosenberg_assessment_id: string
          source_file: string
          source_row: number
          source_sheet: string
          source_total_score: number | null
          verification_from_goalkeep: boolean | null
          verification_from_hfh: boolean | null
        }
        Insert: {
          assessment_date?: string | null
          beneficiary_id: string
          doubt_from_goalkeep?: string | null
          hfh_comments?: string | null
          name_of_child?: string | null
          notes?: string | null
          q1_raw?: string | null
          q1_value?: number | null
          q10_raw?: string | null
          q10_value?: number | null
          q2_raw?: string | null
          q2_value?: number | null
          q3_raw?: string | null
          q3_value?: number | null
          q4_raw?: string | null
          q4_value?: number | null
          q5_raw?: string | null
          q5_value?: number | null
          q6_raw?: string | null
          q6_value?: number | null
          q7_raw?: string | null
          q7_value?: number | null
          q8_raw?: string | null
          q8_value?: number | null
          q9_raw?: string | null
          q9_value?: number | null
          rosenberg_assessment_id?: string
          source_file: string
          source_row: number
          source_sheet: string
          source_total_score?: number | null
          verification_from_goalkeep?: boolean | null
          verification_from_hfh?: boolean | null
        }
        Update: {
          assessment_date?: string | null
          beneficiary_id?: string
          doubt_from_goalkeep?: string | null
          hfh_comments?: string | null
          name_of_child?: string | null
          notes?: string | null
          q1_raw?: string | null
          q1_value?: number | null
          q10_raw?: string | null
          q10_value?: number | null
          q2_raw?: string | null
          q2_value?: number | null
          q3_raw?: string | null
          q3_value?: number | null
          q4_raw?: string | null
          q4_value?: number | null
          q5_raw?: string | null
          q5_value?: number | null
          q6_raw?: string | null
          q6_value?: number | null
          q7_raw?: string | null
          q7_value?: number | null
          q8_raw?: string | null
          q8_value?: number | null
          q9_raw?: string | null
          q9_value?: number | null
          rosenberg_assessment_id?: string
          source_file?: string
          source_row?: number
          source_sheet?: string
          source_total_score?: number | null
          verification_from_goalkeep?: boolean | null
          verification_from_hfh?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "rosenberg_assessment_history_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "beneficiaries"
            referencedColumns: ["beneficiary_id"]
          },
        ]
      }
      stirling_assessment_history: {
        Row: {
          assessment_date: string | null
          beneficiary_id: string
          doubt_from_goalkeep: string | null
          hfh_comments: string | null
          name_of_child: string | null
          notes: string | null
          q1: number | null
          q10: number | null
          q11: number | null
          q12: number | null
          q13: number | null
          q14: number | null
          q15: number | null
          q2: number | null
          q3: number | null
          q4: number | null
          q5: number | null
          q6: number | null
          q7: number | null
          q8: number | null
          q9: number | null
          source: string | null
          source_file: string
          source_row: number
          source_sheet: string
          source_total_score: number | null
          stirling_assessment_id: string
          test_type:
            | Database["public"]["Enums"]["assessment_test_type_enum"]
            | null
          verification_from_goalkeep: boolean | null
          verification_from_hfh: boolean | null
        }
        Insert: {
          assessment_date?: string | null
          beneficiary_id: string
          doubt_from_goalkeep?: string | null
          hfh_comments?: string | null
          name_of_child?: string | null
          notes?: string | null
          q1?: number | null
          q10?: number | null
          q11?: number | null
          q12?: number | null
          q13?: number | null
          q14?: number | null
          q15?: number | null
          q2?: number | null
          q3?: number | null
          q4?: number | null
          q5?: number | null
          q6?: number | null
          q7?: number | null
          q8?: number | null
          q9?: number | null
          source?: string | null
          source_file: string
          source_row: number
          source_sheet: string
          source_total_score?: number | null
          stirling_assessment_id?: string
          test_type?:
            | Database["public"]["Enums"]["assessment_test_type_enum"]
            | null
          verification_from_goalkeep?: boolean | null
          verification_from_hfh?: boolean | null
        }
        Update: {
          assessment_date?: string | null
          beneficiary_id?: string
          doubt_from_goalkeep?: string | null
          hfh_comments?: string | null
          name_of_child?: string | null
          notes?: string | null
          q1?: number | null
          q10?: number | null
          q11?: number | null
          q12?: number | null
          q13?: number | null
          q14?: number | null
          q15?: number | null
          q2?: number | null
          q3?: number | null
          q4?: number | null
          q5?: number | null
          q6?: number | null
          q7?: number | null
          q8?: number | null
          q9?: number | null
          source?: string | null
          source_file?: string
          source_row?: number
          source_sheet?: string
          source_total_score?: number | null
          stirling_assessment_id?: string
          test_type?:
            | Database["public"]["Enums"]["assessment_test_type_enum"]
            | null
          verification_from_goalkeep?: boolean | null
          verification_from_hfh?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "stirling_assessment_history_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "beneficiaries"
            referencedColumns: ["beneficiary_id"]
          },
        ]
      }
    }
    Views: {
      beneficiary_dashboard_chart_data: {
        Row: { chart_name: string | null; label: string | null; sort_order: number | null; value: number | null }
        Relationships: []
      }
      beneficiary_dashboard_summary: {
        Row: { active_count: number | null; exited_count: number | null; total_count: number | null }
        Relationships: []
      }
    }
    Functions: {
      next_hospital_child_id: { Args: never; Returns: string }
    }
    Enums: {
      assessment_test_type_enum: "Pre" | "Post"
      attendance_code_enum: "P" | "NA"
      contact_type_enum: "Call" | "Visit"
      hospital_enum:
        | "Metro Care Hospital A"
        | "Metro Care Hospital B"
        | "Metro Care Hospital C"
        | "Metro Care Hospital D"
      month_enum:
        | "January"
        | "February"
        | "March"
        | "April"
        | "May"
        | "June"
        | "July"
        | "August"
        | "September"
        | "October"
        | "November"
        | "December"
      program_enum: "Daycare" | "Homecare"
      quarter_enum: "Q1" | "Q2" | "Q3" | "Q4"
      status_enum: "Active" | "Deceased"
      ward_enum:
        | "General Ward"
        | "Hematology Ward"
        | "Pediatric Ward"
        | "Ward A"
        | "Ward B"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      assessment_test_type_enum: ["Pre", "Post"],
      attendance_code_enum: ["P", "NA"],
      contact_type_enum: ["Call", "Visit"],
      hospital_enum: [
        "Metro Care Hospital A",
        "Metro Care Hospital B",
        "Metro Care Hospital C",
        "Metro Care Hospital D",
      ],
      month_enum: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      program_enum: ["Daycare", "Homecare"],
      quarter_enum: ["Q1", "Q2", "Q3", "Q4"],
      status_enum: ["Active", "Deceased"],
      ward_enum: [
        "General Ward",
        "Hematology Ward",
        "Pediatric Ward",
        "Ward A",
        "Ward B",
      ],
    },
  },
} as const
