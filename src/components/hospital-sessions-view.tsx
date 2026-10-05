"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DashboardWorkspace, type DashboardChart, type DashboardFilter } from "@/components/dashboard-workspace";
import { HospitalSessionForm } from "@/components/forms/hospital-session-form";
import { SaveToast } from "@/components/save-toast";
import { loadHospitalRecords } from "@/lib/actions/hospital";
import { HOSPITAL_FILTERS, MONTHS, type HospitalFilters } from "@/lib/hospital";
import type { HospitalChartRow, HospitalSummary } from "@/lib/queries/hospital";

const CHARTS: Array<{name:string;title:string;kind:DashboardChart["kind"]}>=[
  {name:"monthly",title:"Sessions per month",kind:"line"},
  {name:"hospital",title:"By hospital",kind:"bar"},
  {name:"top_children",title:"Top 10 children by sessions",kind:"horizontal"},
];
const COLUMNS=[{key:"hospital_child_id",label:"Hospital child ID"},{key:"child_name",label:"Name"},{key:"session_date",label:"Session date"},{key:"hospital_name",label:"Hospital"},{key:"ward",label:"Ward"}];

export function HospitalSessionsView({filters,summary,charts,chartError}:{filters:HospitalFilters;summary:HospitalSummary|null;charts:HospitalChartRow[];chartError?:string}){
  const router=useRouter(); const [,setBusy]=useState(false); const [savedAt,setSavedAt]=useState(0);
  const chartData=CHARTS.map((chart)=>({...chart,rows:charts.filter((row)=>row.chart_name===chart.name).map((row)=>({label:row.label,value:Number(row.value)})),exportUrl:`/hospital/charts/export?chart=${chart.name}`}));
  const filterItems:DashboardFilter[]=[{key:"month",label:"Month",value:filters.month,options:MONTHS},{key:"hospital",label:"Hospital",value:filters.hospital,options:HOSPITAL_FILTERS}];
  return <><DashboardWorkspace title="Hospital Sessions" description="Feedback sessions for the separate hospital-child population." path="/hospital" filters={filterItems}
    scores={[{label:"Total children",value:summary?.total_children??"—",tone:"pink"},{label:"Total sessions",value:summary?.total_sessions??"—",tone:"blue"},{label:"Sessions this month",value:summary?.sessions_this_month??"—",tone:"purple"}]}
    charts={chartData} addLabel="Session" addDescription="Add a session for an existing hospital child or register a new H-ID child."
    addForm={(close)=><HospitalSessionForm close={close} onBusyChange={setBusy} onSaved={()=>{close();setSavedAt(Date.now());router.refresh();}}/>}
    recordColumns={COLUMNS} recordKey="hospital_session_feedback_id" recordsExportUrl="/hospital/export" loadRecords={loadHospitalRecords} chartError={chartError}/>
    <SaveToast savedAt={savedAt}/>
  </>;
}
