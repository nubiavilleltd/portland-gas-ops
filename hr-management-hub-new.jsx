import { useState, useMemo } from "react";

/* ═══════════════════════════════════════════
   CONSTANTS & SEED DATA
   ═══════════════════════════════════════════ */
const A = "#7C3AED";
const DEPTS = ["Legal","Commercial","Assets","Engineering","Operations","Finance","HR","IT","Safety","Admin"];
const CATEGORIES = ["Full Time","Part Time","Contract","Intern"];
const GRADES = ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15"];
const LEAVE_TYPES = ["Annual Leave","Sick Leave","Casual Leave","Maternity Leave","Paternity Leave","Compassionate Leave","Study Leave"];
const POLICY_CATS = ["General","Leave","Conduct","Safety","Finance","Travel"];
const STATUS_S = { Pending:"bg-amber-50 text-amber-700 border border-amber-200", Approved:"bg-emerald-50 text-emerald-700 border border-emerald-200","In Progress":"bg-blue-50 text-blue-700 border border-blue-200", Draft:"bg-gray-100 text-gray-500 border border-gray-200", Rejected:"bg-red-50 text-red-600 border border-red-200", Processed:"bg-violet-50 text-violet-700 border border-violet-200" };

const APPROVERS = {
  Legal:{lm:"Magdalene Edozie",hr:"Oluwaseun Sowemimo"},Commercial:{lm:"Bola Adeyemi",hr:"Oluwaseun Sowemimo"},Assets:{lm:"Opeyemi Busari",hr:"Oluwaseun Sowemimo"},Engineering:{lm:"Samuel Eze",hr:"Oluwaseun Sowemimo"},Operations:{lm:"Johnson Ibikunle",hr:"Oluwaseun Sowemimo"},Finance:{lm:"Ifeanyi Chukwu",hr:"Oluwaseun Sowemimo"},HR:{lm:"Adaeze Nwosu",hr:"Oluwaseun Sowemimo"},IT:{lm:"Emeka Udoh",hr:"Oluwaseun Sowemimo"},Safety:{lm:"David Okeke",hr:"Oluwaseun Sowemimo"},Admin:{lm:"Grace Obi",hr:"Oluwaseun Sowemimo"},
};

const gRef=(p)=>{const d=new Date(),h=()=>Math.random().toString(16).substring(2,6).toUpperCase();return`${p}-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${h()}`};
const fmtDate=(d)=>d?new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}):"—";
const fmtNow=()=>{const d=new Date();return d.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})+" "+d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})};

const SEED_EMP = [
  {id:1,firstName:"Magdalene",lastName:"Edozie",title:"Software Developer",department:"Legal",birthday:"2025-12-17",category:"Full Time",grade:"7",email:"magdalene.edozie@portlandgas.com"},
  {id:2,firstName:"Oluwaseun",lastName:"Sowemimo",title:"Software Developer",department:"Commercial",birthday:"",category:"Full Time",grade:"14",email:"oluwaseun.sowemimo@portlandgas.com"},
  {id:3,firstName:"Opeyemi",lastName:"Busari",title:"Data Analyst",department:"Assets",birthday:"2025-01-26",category:"Full Time",grade:"10",email:"opeyemi.busari@portlandgas.com"},
  {id:4,firstName:"Felix",lastName:"Ohemu",title:"Field Supervisor",department:"Assets",birthday:"2026-04-15",category:"Full Time",grade:"10",email:"felix.ohemu@portlandgas.com"},
  {id:5,firstName:"Johnson",lastName:"Ibikunle",title:"Application Developer",department:"Legal",birthday:"",category:"Full Time",grade:"7",email:"johnson.ibikunle@portlandgas.com"},
  {id:6,firstName:"Joseph",lastName:"Chika",title:"Operations Manager",department:"Operations",birthday:"1990-03-12",category:"Full Time",grade:"12",email:"joseph.chika@portlandgas.com"},
  {id:7,firstName:"David",lastName:"Okeke",title:"Safety Officer",department:"Safety",birthday:"1988-07-22",category:"Full Time",grade:"9",email:"david.okeke@portlandgas.com"},
];

const SEED_LEAVE = [
  {ref:"LRQ-20260515-A1B2",employee:"Joseph Chika",type:"Annual Leave",department:"Operations",startDate:"2026-06-01",endDate:"2026-06-10",days:8,reliefOfficer:"David Okeke",status:"Pending",date:"15 May 2026"},
  {ref:"LRQ-20260510-C3D4",employee:"Magdalene Edozie",type:"Sick Leave",department:"Legal",startDate:"2026-05-12",endDate:"2026-05-13",days:2,reliefOfficer:"Johnson Ibikunle",status:"Approved",date:"10 May 2026"},
  {ref:"LRQ-20260503-E5F6",employee:"Opeyemi Busari",type:"Study Leave",department:"Assets",startDate:"2026-06-15",endDate:"2026-06-30",days:12,reliefOfficer:"Felix Ohemu",status:"In Progress",date:"3 May 2026"},
];

const SEED_RECORDS = [
  {id:1,employee:"Magdalene Edozie",docType:"Employment Contract",fileName:"Edozie_Contract_2024.pdf",uploadDate:"10 Jan 2025",uploadedBy:"HR Admin"},
  {id:2,employee:"Oluwaseun Sowemimo",docType:"ID / Passport Copy",fileName:"Sowemimo_NIN.pdf",uploadDate:"15 Feb 2025",uploadedBy:"HR Admin"},
  {id:3,employee:"Joseph Chika",docType:"Certificates",fileName:"Chika_MBA_Cert.pdf",uploadDate:"3 Mar 2026",uploadedBy:"Joseph Chika"},
  {id:4,employee:"Felix Ohemu",docType:"Employment Contract",fileName:"Ohemu_Contract_2026.pdf",uploadDate:"15 Apr 2026",uploadedBy:"HR Admin"},
  {id:5,employee:"David Okeke",docType:"Safety Certification",fileName:"Okeke_HSE_Cert.pdf",uploadDate:"20 Apr 2026",uploadedBy:"David Okeke"},
];

const SEED_POLICIES = [
  {id:1,name:"Employee Handbook 2026",category:"General",version:"3.1",effectiveDate:"1 Jan 2026",acknowledged:3,total:7},
  {id:2,name:"Annual Leave Policy",category:"Leave",version:"2.0",effectiveDate:"1 Jan 2026",acknowledged:5,total:7},
  {id:3,name:"Code of Conduct",category:"Conduct",version:"1.5",effectiveDate:"1 Mar 2025",acknowledged:7,total:7},
  {id:4,name:"Health & Safety Policy",category:"Safety",version:"4.0",effectiveDate:"15 Jan 2026",acknowledged:4,total:7},
  {id:5,name:"Travel & Expense Policy",category:"Finance",version:"2.2",effectiveDate:"1 Apr 2026",acknowledged:2,total:7},
  {id:6,name:"Anti-Harassment Policy",category:"Conduct",version:"1.0",effectiveDate:"1 Jun 2025",acknowledged:6,total:7},
];

const SEED_PAYSLIPS = [
  {id:1,employee:"Joseph Chika",empId:"PG-006",department:"Operations",period:"April 2026",basic:850000,housing:200000,transport:100000,meal:50000,paye:125000,pension:68000,nhf:21250,loan:0,net:985750},
  {id:2,employee:"Magdalene Edozie",empId:"PG-001",department:"Legal",period:"April 2026",basic:650000,housing:150000,transport:80000,meal:40000,paye:85000,pension:52000,nhf:16250,loan:30000,net:736750},
  {id:3,employee:"Oluwaseun Sowemimo",empId:"PG-002",department:"Commercial",period:"April 2026",basic:950000,housing:250000,transport:120000,meal:60000,paye:165000,pension:76000,nhf:23750,loan:0,net:1115250},
];

const SEED_PAYROLL = [
  {ref:"PAY-202604-A1B2",period:"April 2026",runDate:"28 Apr 2026",totalGross:3500000,totalDeductions:662250,totalNet:2837750,employees:7,status:"Approved",preparedBy:"Adaeze Nwosu"},
  {ref:"PAY-202603-C3D4",period:"March 2026",runDate:"28 Mar 2026",totalGross:3500000,totalDeductions:662250,totalNet:2837750,employees:7,status:"Processed",preparedBy:"Adaeze Nwosu"},
  {ref:"PAY-202605-E5F6",period:"May 2026",runDate:"—",totalGross:0,totalDeductions:0,totalNet:0,employees:7,status:"Draft",preparedBy:"Adaeze Nwosu"},
];


/* ═══════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════ */
const Ico={
  back:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  search:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  plus:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  edit:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  x:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  dl:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  eye:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  check:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  bell:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  menu:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>,
};

function Badge({status}){return <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_S[status]||STATUS_S.Draft}`}>{status}</span>}

function Field({label,required,children}){return(<div><label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}{required&&<span className="text-red-500 ml-0.5">*</span>}</label>{children}</div>)}

const inp="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100 placeholder:text-gray-400";

function TField({label,required,type="text",placeholder,value,onChange,options}){
  return(<Field label={label} required={required}>
    {type==="select"?<select className={`${inp} appearance-none pr-10`} value={value||""} onChange={e=>onChange(e.target.value)}><option value="">— Select —</option>{(options||[]).map(o=><option key={o} value={o}>{o}</option>)}</select>
    :type==="textarea"?<textarea className={`${inp} min-h-[80px] resize-y`} placeholder={placeholder} value={value||""} onChange={e=>onChange(e.target.value)}/>
    :type==="file"?<div className={`${inp} flex items-center gap-3 cursor-pointer border-dashed border-2 hover:border-purple-300`}><span className="text-gray-400">📎</span><span className="text-gray-400 text-sm">Click to upload or drag & drop</span></div>
    :<input type={type} className={inp} placeholder={placeholder} value={value||""} onChange={e=>onChange(e.target.value)}/>}
  </Field>)
}

function SectionLabel({children}){return <p className="text-xs font-bold uppercase tracking-widest mb-4 mt-6" style={{color:A}}>{children}</p>}

function Modal({open,onClose,title,children,width="max-w-2xl"}){
  if(!open)return null;
  return(<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
    <div className={`bg-white rounded-xl shadow-2xl w-full ${width} max-h-[90vh] overflow-y-auto`} onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">{Ico.x}</button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>)
}

function SearchBar({value,onChange,placeholder="Search...",statusFilter,onStatusChange,statuses}){
  return(<div className="flex flex-col sm:flex-row gap-3 mb-5">
    <div className="flex-1 relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{Ico.search}</span><input className={`${inp} pl-10`} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}/></div>
    {statuses&&<select className={`${inp} w-44`} value={statusFilter} onChange={e=>onStatusChange(e.target.value)}><option value="">All Statuses</option>{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select>}
  </div>)
}

function Pagination({total,page,perPage,onPage}){
  const pages=Math.ceil(total/perPage);
  if(pages<=1)return null;
  return(<div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
    <span>{(page-1)*perPage+1}–{Math.min(page*perPage,total)} of {total}</span>
    <div className="flex items-center gap-1">{Array.from({length:pages},(_,i)=><button key={i} onClick={()=>onPage(i+1)} className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${page===i+1?"text-white":"text-gray-500 hover:bg-gray-100"}`} style={page===i+1?{backgroundColor:A}:{}}>{i+1}</button>)}</div>
  </div>)
}

function WorkflowPath({initiator,department,currentStep,approver2Label="HR Review (Approver 2)"}){
  const ap=APPROVERS[department]||APPROVERS.Legal;
  const steps=[{role:"Initiator",name:initiator,sub:"Initiator"},{role:"Line Manager (Approver 1)",name:ap.lm,sub:"Line Manager"},{role:approver2Label,name:ap.hr,sub:approver2Label.split("(")[0].trim()}];
  return(<div className="border border-gray-200 rounded-xl p-5 bg-white mb-5">
    <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{color:A}}>Workflow path</h3>
    <div className="flex flex-wrap items-start gap-2">{steps.map((s,i)=>{const act=i===currentStep,done=i<currentStep;return(<div key={i} className="flex items-center gap-2"><div className={`rounded-lg border-2 p-3 min-w-[140px] transition-all ${act?"text-white shadow-lg shadow-purple-200":done?"border-emerald-300 bg-emerald-50":"border-gray-200 bg-white"}`} style={act?{backgroundColor:A,borderColor:A}:{}}><p className={`text-xs font-bold ${act?"text-purple-200":done?"text-emerald-600":"text-purple-600"}`}>{s.role}</p><p className={`text-sm font-semibold mt-1 ${act?"text-white":"text-gray-800"}`}>{s.name}</p><p className={`text-xs mt-0.5 ${act?"text-purple-200":"text-gray-400"}`}>{s.sub}</p></div>{i<steps.length-1&&<div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[12px]" style={{borderLeftColor:done?"#34d399":act?A:"#d1d5db"}}/>}</div>)})}</div>
  </div>)
}

function ActivityHistory({initiator,department,currentStep,approver2Label="HR Review (Approver 2)"}){
  const ap=APPROVERS[department]||APPROVERS.Legal;
  const rows=[{name:`${initiator} (Initiator)`,action:"Submitted",date:fmtNow(),comment:"Request submitted — Awaiting Approval",next:`${ap.lm} (Line Manager — Approver 1)`}];
  if(currentStep>=1)rows.push({name:`${ap.lm} (Line Manager — Approver 1)`,action:currentStep>1?"Approved":"Pending",date:currentStep>1?fmtNow():"—",comment:currentStep>1?"Reviewed and approved":"Awaiting review",next:`${ap.hr} (${approver2Label.split("(")[0].trim()} — Approver 2)`});
  if(currentStep>=2)rows.push({name:`${ap.hr} (${approver2Label.split("(")[0].trim()} — Approver 2)`,action:"Pending",date:"—",comment:"Awaiting review",next:"—"});
  return(<div className="border border-gray-200 rounded-xl bg-white overflow-hidden mb-5">
    <div className="p-5 border-b border-gray-100"><h3 className="text-sm font-bold uppercase tracking-wider" style={{color:A}}>Workflow activity history</h3></div>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left">{["Name","Action/Status","Date","Comment","Next Approver"].map(h=><th key={h} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i} className="border-t border-gray-100 hover:bg-gray-50/50"><td className="px-5 py-3 font-medium" style={{color:A}}>{r.name}</td><td className="px-5 py-3">{r.action}</td><td className="px-5 py-3 text-gray-500">{r.date}</td><td className="px-5 py-3 text-gray-600">{r.comment}</td><td className="px-5 py-3" style={{color:A}}>{r.next}</td></tr>)}</tbody></table></div>
  </div>)
}

function SubmittedView({ref_,title,initiator,department,onBack,onNew,backLabel,approver2Label="HR Review (Approver 2)"}){
  return(<div>
    <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-700 font-medium mb-5 transition">{Ico.back} {backLabel}</button>
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6 flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>
      <div><h2 className="text-lg font-bold text-emerald-800">Request Submitted Successfully</h2><p className="text-emerald-600 text-sm mt-1">Reference: <span className="font-mono font-bold">{ref_}</span> — Routed to the first approver.</p></div>
    </div>
    <div className="border border-gray-200 rounded-xl p-5 bg-white mb-5">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Approval workflow</h3>
      <div className="flex items-center gap-3 overflow-x-auto py-2">{["Submitted","Line Manager",approver2Label.split("(")[0].trim(),"Processed"].map((l,i)=>{const done=i===0,cur=i===1;return(<div key={i} className="flex items-center gap-3 shrink-0"><div className="flex flex-col items-center"><div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${done?"bg-emerald-500 text-white":cur?"text-white ring-4 ring-purple-200":"bg-gray-200 text-gray-400"}`} style={cur?{backgroundColor:A}:{}}>{done?"✓":i+1}</div><span className="text-xs text-gray-500 mt-2 whitespace-nowrap font-medium">{l}</span></div>{i<3&&<div className={`w-12 h-0.5 mb-5 ${done?"bg-emerald-400":"bg-gray-200"}`}/>}</div>)})}</div>
    </div>
    <WorkflowPath initiator={initiator} department={department} currentStep={1} approver2Label={approver2Label}/>
    <ActivityHistory initiator={initiator} department={department} currentStep={1} approver2Label={approver2Label}/>
    <div className="flex gap-3"><button onClick={onBack} className="px-6 py-2.5 text-white rounded-lg text-sm font-bold hover:opacity-90 transition" style={{backgroundColor:A}}>View All</button><button onClick={onNew} className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">Submit Another</button></div>
  </div>)
}

/* ═══════════════════════════════════════════
   MODULE 1: EMPLOYEE PROFILE
   ═══════════════════════════════════════════ */
function EmployeeProfile(){
  const [employees,setEmployees]=useState(SEED_EMP);
  const [search,setSearch]=useState("");
  const [modal,setModal]=useState(false);
  const [editId,setEditId]=useState(null);
  const [form,setForm]=useState({});
  const [page,setPage]=useState(1);
  const pp=10;
  const filtered=employees.filter(e=>`${e.firstName} ${e.lastName} ${e.title} ${e.department}`.toLowerCase().includes(search.toLowerCase()));
  const paged=filtered.slice((page-1)*pp,page*pp);

  const openAdd=()=>{setForm({});setEditId(null);setModal(true)};
  const openEdit=(emp)=>{setForm({...emp});setEditId(emp.id);setModal(true)};
  const save=()=>{
    if(editId){setEmployees(p=>p.map(e=>e.id===editId?{...e,...form}:e))}
    else{setEmployees(p=>[...p,{...form,id:Date.now()}])}
    setModal(false);setForm({});
  };
  const remove=(id)=>setEmployees(p=>p.filter(e=>e.id!==id));
  const u=(k,v)=>setForm(p=>({...p,[k]:v}));

  return(<div>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Employee Profile</h1><p className="text-gray-500 text-sm">Manage employee profiles and records</p></div>
      <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-lg shadow-lg hover:opacity-90 transition shrink-0" style={{backgroundColor:A}}>{Ico.plus} Add New Profile</button>
    </div>
    <SearchBar value={search} onChange={setSearch}/>
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-200 text-left">{["First Name","Last Name","User Title","Department","Birthday","Category","Grade","Actions"].map(h=><th key={h} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>{paged.map((e,i)=><tr key={e.id} className="border-t border-gray-100 hover:bg-gray-50/60">
            <td className="px-5 py-3 text-gray-800 font-medium">{e.firstName}</td><td className="px-5 py-3 text-gray-800 font-medium">{e.lastName}</td><td className="px-5 py-3 text-gray-600">{e.title}</td><td className="px-5 py-3 text-gray-600">{e.department}</td><td className="px-5 py-3 text-gray-500">{fmtDate(e.birthday)}</td><td className="px-5 py-3 text-gray-600">{e.category}</td><td className="px-5 py-3 text-gray-600">{e.grade}</td>
            <td className="px-5 py-3"><div className="flex items-center gap-2"><button onClick={()=>remove(e.id)} className="p-1.5 rounded hover:bg-red-50 transition">{Ico.trash}</button><button onClick={()=>openEdit(e)} className="p-1.5 rounded hover:bg-emerald-50 transition">{Ico.edit}</button></div></td>
          </tr>)}</tbody>
        </table>
      </div>
      <Pagination total={filtered.length} page={page} perPage={pp} onPage={setPage}/>
    </div>
    <Modal open={modal} onClose={()=>setModal(false)} title={editId?"Edit Profile":"Add New Item"}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <TField label="First Name" required placeholder="First name" value={form.firstName} onChange={v=>u("firstName",v)}/>
        <TField label="Last Name" required placeholder="Last name" value={form.lastName} onChange={v=>u("lastName",v)}/>
        <TField label="Email" required type="email" placeholder="email@company.com" value={form.email} onChange={v=>u("email",v)}/>
        <TField label="User Title" required placeholder="e.g. Software Developer" value={form.title} onChange={v=>u("title",v)}/>
        <TField label="Department" required type="select" options={DEPTS} value={form.department} onChange={v=>u("department",v)}/>
        <TField label="Category Of Personnel" required type="select" options={CATEGORIES} value={form.category} onChange={v=>u("category",v)}/>
        <TField label="Birthday" required type="date" value={form.birthday} onChange={v=>u("birthday",v)}/>
        <TField label="Grade Level" required type="select" options={GRADES} value={form.grade} onChange={v=>u("grade",v)}/>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button onClick={save} className="px-6 py-2.5 text-white rounded-lg text-sm font-bold hover:opacity-90 transition" style={{backgroundColor:A}}>{editId?"Update Profile":"Create Profile"}</button>
        <button onClick={()=>setModal(false)} className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">Close</button>
      </div>
    </Modal>
  </div>)
}

/* ═══════════════════════════════════════════
   MODULE 2: LEAVE REQUESTS
   ═══════════════════════════════════════════ */
function LeaveRequests(){
  const [list,setList]=useState(SEED_LEAVE);
  const [view,setView]=useState("list");
  const [search,setSearch]=useState("");
  const [statusF,setStatusF]=useState("");
  const [form,setForm]=useState({});
  const [submitted,setSubmitted]=useState(null);
  const [page,setPage]=useState(1);
  const pp=10;
  const filtered=list.filter(r=>{const m=`${r.ref} ${r.employee} ${r.type} ${r.department}`.toLowerCase().includes(search.toLowerCase());const s=!statusF||r.status===statusF;return m&&s});
  const paged=filtered.slice((page-1)*pp,page*pp);
  const u=(k,v)=>setForm(p=>({...p,[k]:v}));

  const submit=()=>{
    const ref=gRef("LRQ");const dept=form.department||"Legal";
    setList(p=>[{ref,employee:form.employee||"Current User",type:form.leaveType||"Annual Leave",department:dept,startDate:form.startDate,endDate:form.endDate,days:form.days||1,reliefOfficer:form.reliefOfficer||"—",status:"Pending",date:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})},...p]);
    setSubmitted({ref,employee:form.employee||"Current User",department:dept});setView("submitted");
  };

  if(view==="submitted"&&submitted) return <SubmittedView ref_={submitted.ref} initiator={submitted.employee} department={submitted.department} onBack={()=>{setView("list");setForm({})}} onNew={()=>{setView("form");setForm({})}} backLabel="Back to Leave Requests" approver2Label="HR Review (Approver 2)"/>;

  if(view==="form") return(<div>
    <button onClick={()=>setView("list")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-700 font-medium mb-5 transition">{Ico.back} Back to Leave Requests</button>
    <h1 className="text-2xl font-bold text-gray-900 mb-1">New Leave Request</h1><p className="text-gray-500 text-sm mb-6">Submit a leave request for approval</p>
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden"><div className="h-1.5 w-full" style={{background:`linear-gradient(90deg,${A},${A}88)`}}/><div className="p-5 lg:p-8">
      <SectionLabel>Employee details</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <TField label="Employee Name" required placeholder="Your full name" value={form.employee} onChange={v=>u("employee",v)}/>
        <TField label="Department" required type="select" options={DEPTS} value={form.department} onChange={v=>u("department",v)}/>
      </div>
      <SectionLabel>Leave details</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <TField label="Leave Type" required type="select" options={LEAVE_TYPES} value={form.leaveType} onChange={v=>u("leaveType",v)}/>
        <TField label="Number of Days" required type="number" placeholder="0" value={form.days} onChange={v=>u("days",v)}/>
        <TField label="Start Date" required type="date" value={form.startDate} onChange={v=>u("startDate",v)}/>
        <TField label="End Date" required type="date" value={form.endDate} onChange={v=>u("endDate",v)}/>
        <TField label="Relief Officer" required placeholder="Who covers for you" value={form.reliefOfficer} onChange={v=>u("reliefOfficer",v)}/>
        <TField label="Supporting Document" type="file"/>
      </div>
      <SectionLabel>Justification</SectionLabel>
      <TField label="Reason / Notes" type="textarea" placeholder="Brief reason for this leave request..." value={form.reason} onChange={v=>u("reason",v)}/>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8 pt-6 border-t border-gray-100">
        <button onClick={submit} className="px-8 py-3 text-white rounded-lg text-sm font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition" style={{backgroundColor:A}}>Submit for Approval →</button>
        <button onClick={()=>setForm({})} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">Clear Form</button>
        <button className="px-6 py-3 text-gray-400 rounded-lg text-sm font-medium hover:text-gray-600 transition sm:ml-auto">Save as Draft</button>
      </div>
    </div></div>
  </div>);

  return(<div>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1><p className="text-gray-500 text-sm">Manage leave requests and approvals</p></div>
      <button onClick={()=>{setView("form");setForm({})}} className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-lg shadow-lg hover:opacity-90 transition shrink-0" style={{backgroundColor:A}}>{Ico.plus} New Request</button>
    </div>
    <SearchBar value={search} onChange={setSearch} statuses={["Pending","Approved","In Progress","Rejected"]} statusFilter={statusF} onStatusChange={setStatusF}/>
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200 text-left">{["Reference","Employee","Leave Type","Department","Days","Start Date","Status",""].map(h=><th key={h} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
      <tbody>{paged.map((r,i)=><tr key={i} className="border-t border-gray-100 hover:bg-gray-50/60"><td className="px-5 py-3 font-mono text-xs text-gray-500">{r.ref}</td><td className="px-5 py-3 text-gray-800 font-medium">{r.employee}</td><td className="px-5 py-3 text-gray-600">{r.type}</td><td className="px-5 py-3 text-gray-600">{r.department}</td><td className="px-5 py-3 text-gray-800 font-semibold">{r.days}</td><td className="px-5 py-3 text-gray-500">{fmtDate(r.startDate)}</td><td className="px-5 py-3"><Badge status={r.status}/></td><td className="px-5 py-3"><button className="p-1.5 rounded hover:bg-gray-100 text-gray-400">{Ico.eye}</button></td></tr>)}</tbody></table></div>
      <Pagination total={filtered.length} page={page} perPage={pp} onPage={setPage}/>
    </div>
  </div>)
}

/* ═══════════════════════════════════════════
   MODULE 3: EMPLOYEE RECORDS
   ═══════════════════════════════════════════ */
function EmployeeRecords(){
  const [records,setRecords]=useState(SEED_RECORDS);
  const [search,setSearch]=useState("");
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({});
  const filtered=records.filter(r=>`${r.employee} ${r.docType} ${r.fileName}`.toLowerCase().includes(search.toLowerCase()));
  const u=(k,v)=>setForm(p=>({...p,[k]:v}));
  const upload=()=>{setRecords(p=>[{id:Date.now(),employee:form.employee||"—",docType:form.docType||"Other",fileName:form.fileName||"document.pdf",uploadDate:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}),uploadedBy:"HR Admin"},...p]);setModal(false);setForm({})};

  return(<div>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Employee Records</h1><p className="text-gray-500 text-sm">Centralized document vault for all employee records</p></div>
      <button onClick={()=>{setModal(true);setForm({})}} className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-lg shadow-lg hover:opacity-90 transition shrink-0" style={{backgroundColor:A}}>{Ico.plus} Upload Document</button>
    </div>
    <SearchBar value={search} onChange={setSearch}/>
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200 text-left">{["Employee","Document Type","File Name","Upload Date","Uploaded By","Actions"].map(h=><th key={h} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
    <tbody>{filtered.map((r,i)=><tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50/60"><td className="px-5 py-3 text-gray-800 font-medium">{r.employee}</td><td className="px-5 py-3 text-gray-600">{r.docType}</td><td className="px-5 py-3 text-gray-600 font-mono text-xs">{r.fileName}</td><td className="px-5 py-3 text-gray-500">{r.uploadDate}</td><td className="px-5 py-3 text-gray-500">{r.uploadedBy}</td><td className="px-5 py-3"><div className="flex gap-2"><button className="p-1.5 rounded hover:bg-gray-100 text-gray-400" title="View">{Ico.eye}</button><button className="p-1.5 rounded hover:bg-gray-100 text-gray-400" title="Download">{Ico.dl}</button><button className="p-1.5 rounded hover:bg-red-50" title="Delete">{Ico.trash}</button></div></td></tr>)}</tbody></table></div></div>
    <Modal open={modal} onClose={()=>setModal(false)} title="Upload Document">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <TField label="Employee" required type="select" options={SEED_EMP.map(e=>`${e.firstName} ${e.lastName}`)} value={form.employee} onChange={v=>u("employee",v)}/>
        <TField label="Document Type" required type="select" options={["Employment Contract","ID / Passport Copy","Certificates","Safety Certification","Disciplinary Record","Other"]} value={form.docType} onChange={v=>u("docType",v)}/>
        <div className="md:col-span-2"><TField label="Upload File" required type="file"/></div>
        <div className="md:col-span-2"><TField label="Notes" type="textarea" placeholder="Optional notes about this document..." value={form.notes} onChange={v=>u("notes",v)}/></div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button onClick={upload} className="px-6 py-2.5 text-white rounded-lg text-sm font-bold hover:opacity-90 transition" style={{backgroundColor:A}}>Upload</button>
        <button onClick={()=>setModal(false)} className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">Close</button>
      </div>
    </Modal>
  </div>)
}

/* ═══════════════════════════════════════════
   MODULE 4: HR POLICY ACCESS
   ═══════════════════════════════════════════ */
const POLICY_DOCS = {
  1: {title:"Employee Handbook 2026",sections:[
    {heading:"1. Introduction",body:"Welcome to Portland Gas. This handbook outlines the policies, procedures, and expectations that govern your employment. All employees are expected to familiarize themselves with its contents and comply with the guidelines herein."},
    {heading:"2. Employment Terms",body:"Employment at Portland Gas is governed by the terms set forth in your offer letter and this handbook. Standard working hours are 8:00 AM to 5:00 PM, Monday through Friday. Overtime must be pre-approved by your Line Manager. Probationary period for new hires is 6 months."},
    {heading:"3. Compensation & Benefits",body:"Salaries are paid monthly on the 25th of each month via direct bank transfer. Benefits include health insurance (HMO), pension contributions (in line with the Pension Reform Act), housing allowance, transport allowance, and meal subsidy. Annual salary reviews are conducted in Q1."},
    {heading:"4. Leave Entitlements",body:"Annual Leave: 20 working days per year. Sick Leave: 10 working days (medical certificate required after 2 consecutive days). Maternity Leave: 12 weeks. Paternity Leave: 10 working days. Casual Leave: 5 days per year. Study Leave: subject to approval."},
    {heading:"5. Disciplinary Procedures",body:"Portland Gas follows a progressive discipline approach: verbal warning, written warning, final written warning, and termination. Gross misconduct (fraud, theft, violence, harassment) may result in immediate dismissal. All disciplinary actions are documented in the employee's record."},
  ]},
  2: {title:"Annual Leave Policy",sections:[
    {heading:"1. Eligibility",body:"All confirmed full-time employees are entitled to 20 working days of annual leave per calendar year. Leave accrues at 1.67 days per month. Employees on probation may take up to 5 days with Line Manager approval."},
    {heading:"2. Application Process",body:"Leave requests must be submitted at least 2 weeks in advance through the HR portal. The request goes through a 2-level approval: Line Manager (Approver 1) and HR Review (Approver 2). Emergency leave requests will be considered on a case-by-case basis."},
    {heading:"3. Carry-Over & Buy-Back",body:"A maximum of 5 unused leave days may be carried over to the following year. Carried-over days must be used by March 31st. Unused leave beyond the carry-over limit is forfeited. There is no cash buy-back for unused leave days."},
  ]},
  3: {title:"Code of Conduct",sections:[
    {heading:"1. Professional Behaviour",body:"Employees are expected to maintain the highest standards of professional conduct. This includes punctuality, respectful communication, appropriate dress code, and adherence to company policies. Representing Portland Gas externally requires prior approval."},
    {heading:"2. Conflict of Interest",body:"Employees must avoid situations where personal interests conflict with the company's interests. Any potential conflicts must be disclosed to HR immediately. Outside employment or business activities require written approval from the Head of Department."},
    {heading:"3. Confidentiality",body:"All proprietary information, trade secrets, client data, and internal communications are strictly confidential. Unauthorized disclosure of company information — during or after employment — is grounds for disciplinary action and potential legal proceedings."},
  ]},
  4: {title:"Health & Safety Policy",sections:[
    {heading:"1. General Safety",body:"Portland Gas is committed to providing a safe and healthy work environment for all employees, contractors, and visitors. All personnel must comply with safety regulations, wear required PPE, and report hazards immediately to the Safety Officer."},
    {heading:"2. Emergency Procedures",body:"Emergency assembly points are clearly marked at all facilities. Fire drills are conducted quarterly. All employees must familiarize themselves with evacuation routes and first aid locations. Emergency contact: Safety Hotline — 0800-SAFE-PG."},
    {heading:"3. Incident Reporting",body:"All workplace incidents, injuries, near-misses, and unsafe conditions must be reported within 24 hours using the HSE Incident Report form. Failure to report incidents is a disciplinary offence. Investigations are conducted by the Safety Committee."},
  ]},
  5: {title:"Travel & Expense Policy",sections:[
    {heading:"1. Travel Authorization",body:"All business travel must be pre-approved via a Travel Request Form submitted through the Finance portal. Domestic travel requires Line Manager approval. International travel requires additional approval from the Head of Department and Finance."},
    {heading:"2. Expense Claims",body:"Employees may claim reimbursement for approved business expenses. Claims must be submitted within 14 days of the expense with original receipts. Per diem rates: Lagos — ₦15,000/day; Other cities — ₦12,000/day; International — determined per destination."},
    {heading:"3. Accommodation & Transport",body:"Hotel bookings should be made through the Admin department where possible. Maximum hotel rates: Lagos — ₦35,000/night; Other cities — ₦25,000/night. Local transport: official company vehicles or approved ride-hailing services. Personal car mileage: ₦80/km."},
  ]},
  6: {title:"Anti-Harassment Policy",sections:[
    {heading:"1. Policy Statement",body:"Portland Gas has zero tolerance for harassment, bullying, or discrimination of any kind. This policy applies to all employees, contractors, and visitors across all company premises, events, and digital platforms."},
    {heading:"2. What Constitutes Harassment",body:"Harassment includes but is not limited to: unwelcome physical contact, verbal abuse, intimidation, offensive jokes or comments, sexual advances, cyberbullying, exclusion or isolation, and retaliation against those who report harassment."},
    {heading:"3. Reporting & Resolution",body:"Reports can be made to your Line Manager, HR, or anonymously via the Ethics Hotline. All reports are investigated confidentially within 10 working days. Substantiated cases result in disciplinary action up to and including termination. Whistleblower protections apply."},
  ]},
};

function HRPolicies(){
  const [policies]=useState(SEED_POLICIES);
  const [search,setSearch]=useState("");
  const [catF,setCatF]=useState("");
  const [viewing,setViewing]=useState(null);
  const filtered=policies.filter(p=>{const m=`${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase());const c=!catF||p.category===catF;return m&&c});

  if(viewing){
    const doc=POLICY_DOCS[viewing.id];
    const downloadDoc=()=>{
      const text=doc.sections.map(s=>`${s.heading}\n\n${s.body}`).join("\n\n---\n\n");
      const blob=new Blob([`PORTLAND GAS OPERATIONS\n${"=".repeat(40)}\n\n${doc.title}\nVersion: ${viewing.version} | Effective: ${viewing.effectiveDate}\n\n${"=".repeat(40)}\n\n${text}\n\n---\nEnd of document.\n© Portland Gas Operations ${new Date().getFullYear()}`],{type:"text/plain"});
      const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`${doc.title.replace(/\s+/g,"_")}.txt`;a.click();URL.revokeObjectURL(url);
    };
    return(<div>
      <button onClick={()=>setViewing(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-700 font-medium mb-5 transition">{Ico.back} Back to Policies</button>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="h-1.5 w-full" style={{background:`linear-gradient(90deg,${A},${A}88)`}}/>
        <div className="p-6 lg:p-10">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 pb-6 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-3 mb-2"><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">{viewing.category}</span><span className="text-xs text-gray-400">v{viewing.version}</span></div>
              <h1 className="text-2xl font-bold text-gray-900">{doc.title}</h1>
              <p className="text-sm text-gray-400 mt-1">Effective: {viewing.effectiveDate} · Portland Gas Operations</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={downloadDoc} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition">{Ico.dl} Download</button>
              <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition">{Ico.check} I Acknowledge</button>
            </div>
          </div>
          <div className="space-y-8">
            {doc.sections.map((s,i)=>(<div key={i}>
              <h2 className="text-lg font-bold text-gray-900 mb-3">{s.heading}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
            </div>))}
          </div>
          <div className="mt-10 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
            <p>Portland Gas Operations · Confidential · {doc.title} · v{viewing.version}</p>
          </div>
        </div>
      </div>
    </div>)
  }

  return(<div>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div><h1 className="text-2xl font-bold text-gray-900">HR Policies</h1><p className="text-gray-500 text-sm">Company policy library — view, download, and acknowledge</p></div>
    </div>
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      <div className="flex-1 relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{Ico.search}</span><input className={`${inp} pl-10`} placeholder="Search policies..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <select className={`${inp} w-44`} value={catF} onChange={e=>setCatF(e.target.value)}><option value="">All Categories</option>{POLICY_CATS.map(c=><option key={c} value={c}>{c}</option>)}</select>
    </div>
    <div className="space-y-4">
      {filtered.map(p=>{const pct=Math.round(p.acknowledged/p.total*100);const downloadDoc=()=>{
        const doc=POLICY_DOCS[p.id];if(!doc)return;
        const text=doc.sections.map(s=>`${s.heading}\n\n${s.body}`).join("\n\n---\n\n");
        const blob=new Blob([`PORTLAND GAS OPERATIONS\n${"=".repeat(40)}\n\n${doc.title}\nVersion: ${p.version} | Effective: ${p.effectiveDate}\n\n${"=".repeat(40)}\n\n${text}\n\n---\nEnd of document.\n© Portland Gas Operations ${new Date().getFullYear()}`],{type:"text/plain"});
        const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`${doc.title.replace(/\s+/g,"_")}.txt`;a.click();URL.revokeObjectURL(url);
      };return(
        <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-purple-200 transition-all">
          <div className="flex items-start justify-between mb-2"><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">{p.category}</span><span className="text-xs text-gray-400">v{p.version}</span></div>
          <h3 className="font-bold text-gray-900 mb-1">{p.name}</h3>
          <p className="text-xs text-gray-400 mb-4">Effective: {p.effectiveDate}</p>
          <div className="mb-4"><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Acknowledged</span><span>{p.acknowledged}/{p.total} ({pct}%)</span></div><div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:`${pct}%`,backgroundColor:pct===100?"#059669":A}}/></div></div>
          <div className="flex gap-2"><button onClick={()=>setViewing(p)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full hover:opacity-90 text-white transition" style={{backgroundColor:A}}>{Ico.eye} View</button><button onClick={downloadDoc} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition">{Ico.dl} Download</button><button className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition">{Ico.check} Acknowledge</button></div>
        </div>)})}
    </div>
  </div>)
}

/* ═══════════════════════════════════════════
   MODULE 5: PAY SLIP
   ═══════════════════════════════════════════ */
function PaySlip(){
  const [slips]=useState(SEED_PAYSLIPS);
  const [selected,setSelected]=useState(null);
  const [period,setPeriod]=useState("April 2026");
  const filtered=slips.filter(s=>s.period===period);

  if(selected){
    const s=selected;const gross=s.basic+s.housing+s.transport+s.meal;const ded=s.paye+s.pension+s.nhf+s.loan;
    return(<div>
      <button onClick={()=>setSelected(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-700 font-medium mb-5 transition">{Ico.back} Back to Pay Slips</button>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="h-1.5 w-full" style={{background:`linear-gradient(90deg,${A},${A}88)`}}/>
        <div className="p-6 lg:p-8">
          <div className="flex justify-between items-start mb-6"><div><h2 className="text-xl font-bold text-gray-900">Pay Slip — {s.period}</h2><p className="text-sm text-gray-500 mt-1">{s.employee} · {s.empId} · {s.department}</p></div><button className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition">{Ico.dl} Download PDF</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-xl overflow-hidden"><div className="px-5 py-3 font-bold text-sm text-white" style={{backgroundColor:"#059669"}}>Earnings</div><table className="w-full text-sm"><tbody>
              {[["Basic Salary",s.basic],["Housing Allowance",s.housing],["Transport Allowance",s.transport],["Meal Allowance",s.meal]].map(([l,v])=><tr key={l} className="border-t border-gray-100"><td className="px-5 py-2.5 text-gray-600">{l}</td><td className="px-5 py-2.5 text-right font-semibold text-gray-800">₦{v.toLocaleString()}</td></tr>)}
              <tr className="border-t-2 border-gray-300 bg-gray-50"><td className="px-5 py-2.5 font-bold text-gray-800">Total Earnings</td><td className="px-5 py-2.5 text-right font-bold text-gray-900">₦{gross.toLocaleString()}</td></tr>
            </tbody></table></div>
            <div className="border border-gray-200 rounded-xl overflow-hidden"><div className="px-5 py-3 font-bold text-sm text-white bg-red-500">Deductions</div><table className="w-full text-sm"><tbody>
              {[["PAYE Tax",s.paye],["Pension",s.pension],["NHF",s.nhf],["Loan Repayment",s.loan]].map(([l,v])=><tr key={l} className="border-t border-gray-100"><td className="px-5 py-2.5 text-gray-600">{l}</td><td className="px-5 py-2.5 text-right font-semibold text-gray-800">₦{v.toLocaleString()}</td></tr>)}
              <tr className="border-t-2 border-gray-300 bg-gray-50"><td className="px-5 py-2.5 font-bold text-gray-800">Total Deductions</td><td className="px-5 py-2.5 text-right font-bold text-red-600">₦{ded.toLocaleString()}</td></tr>
            </tbody></table></div>
          </div>
          <div className="mt-6 p-5 rounded-xl border-2" style={{borderColor:A,backgroundColor:`${A}08`}}>
            <div className="flex justify-between items-center"><span className="text-lg font-bold text-gray-900">Net Pay</span><span className="text-2xl font-bold" style={{color:A}}>₦{s.net.toLocaleString()}</span></div>
          </div>
        </div>
      </div>
    </div>)
  }

  return(<div>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Pay Slips</h1><p className="text-gray-500 text-sm">View and download your monthly pay slips</p></div>
      <select className={`${inp} w-48`} value={period} onChange={e=>setPeriod(e.target.value)}>{["May 2026","April 2026","March 2026","February 2026","January 2026"].map(p=><option key={p} value={p}>{p}</option>)}</select>
    </div>
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200 text-left">{["Employee","Employee ID","Department","Period","Basic","Net Pay","Actions"].map(h=><th key={h} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
    <tbody>{filtered.map(s=><tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50/60 cursor-pointer" onClick={()=>setSelected(s)}><td className="px-5 py-3 text-gray-800 font-medium">{s.employee}</td><td className="px-5 py-3 font-mono text-xs text-gray-500">{s.empId}</td><td className="px-5 py-3 text-gray-600">{s.department}</td><td className="px-5 py-3 text-gray-500">{s.period}</td><td className="px-5 py-3 text-gray-800 font-semibold">₦{s.basic.toLocaleString()}</td><td className="px-5 py-3 font-bold" style={{color:A}}>₦{s.net.toLocaleString()}</td><td className="px-5 py-3"><button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition">{Ico.eye} View</button></td></tr>)}</tbody></table></div></div>
  </div>)
}

/* ═══════════════════════════════════════════
   MODULE 6: PAYROLL
   ═══════════════════════════════════════════ */
function Payroll(){
  const [list,setList]=useState(SEED_PAYROLL);
  const [view,setView]=useState("list");
  const [form,setForm]=useState({});
  const [submitted,setSubmitted]=useState(null);
  const [search,setSearch]=useState("");
  const [statusF,setStatusF]=useState("");
  const filtered=list.filter(r=>{const m=`${r.ref} ${r.period}`.toLowerCase().includes(search.toLowerCase());const s=!statusF||r.status===statusF;return m&&s});
  const u=(k,v)=>setForm(p=>({...p,[k]:v}));

  const submit=()=>{
    const ref=gRef("PAY");
    setList(p=>[{ref,period:form.period||"June 2026",runDate:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}),totalGross:parseFloat(form.totalGross||0),totalDeductions:parseFloat(form.totalDeductions||0),totalNet:parseFloat(form.totalNet||0),employees:parseInt(form.employees||7),status:"Pending",preparedBy:form.preparedBy||"HR Admin"},...p]);
    setSubmitted({ref,preparedBy:form.preparedBy||"HR Admin",department:"Finance"});setView("submitted");
  };

  if(view==="submitted"&&submitted)return <SubmittedView ref_={submitted.ref} initiator={submitted.preparedBy} department={submitted.department} onBack={()=>{setView("list");setForm({})}} onNew={()=>{setView("form");setForm({})}} backLabel="Back to Payroll" approver2Label="Finance Reviewer (Approver 2)"/>;

  if(view==="form")return(<div>
    <button onClick={()=>setView("list")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-700 font-medium mb-5 transition">{Ico.back} Back to Payroll</button>
    <h1 className="text-2xl font-bold text-gray-900 mb-1">New Payroll Run</h1><p className="text-gray-500 text-sm mb-6">Prepare monthly payroll for approval and disbursement</p>
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden"><div className="h-1.5 w-full" style={{background:`linear-gradient(90deg,${A},${A}88)`}}/><div className="p-5 lg:p-8">
      <SectionLabel>Payroll details</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <TField label="Pay Period" required type="select" options={["June 2026","May 2026","April 2026"]} value={form.period} onChange={v=>u("period",v)}/>
        <TField label="Run Date" required type="date" value={form.runDate} onChange={v=>u("runDate",v)}/>
        <TField label="Number of Employees" required type="number" placeholder="7" value={form.employees} onChange={v=>u("employees",v)}/>
        <TField label="Prepared By" required placeholder="HR Officer name" value={form.preparedBy} onChange={v=>u("preparedBy",v)}/>
      </div>
      <SectionLabel>Financial summary</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
        <TField label="Total Gross (₦)" required type="number" placeholder="0.00" value={form.totalGross} onChange={v=>u("totalGross",v)}/>
        <TField label="Total Deductions (₦)" required type="number" placeholder="0.00" value={form.totalDeductions} onChange={v=>u("totalDeductions",v)}/>
        <TField label="Total Net Pay (₦)" required type="number" placeholder="0.00" value={form.totalNet} onChange={v=>u("totalNet",v)}/>
      </div>
      <SectionLabel>Adjustments &amp; notes</SectionLabel>
      <TField label="Notes / Adjustments" type="textarea" placeholder="Overtime, bonuses, special deductions..." value={form.notes} onChange={v=>u("notes",v)}/>
      <div className="md:col-span-2 mt-4"><TField label="Upload Payroll Sheet" type="file"/></div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8 pt-6 border-t border-gray-100">
        <button onClick={submit} className="px-8 py-3 text-white rounded-lg text-sm font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition" style={{backgroundColor:A}}>Submit for Approval →</button>
        <button onClick={()=>setForm({})} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">Clear Form</button>
        <button className="px-6 py-3 text-gray-400 rounded-lg text-sm font-medium hover:text-gray-600 transition sm:ml-auto">Save as Draft</button>
      </div>
    </div></div>
  </div>);

  return(<div>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Payroll</h1><p className="text-gray-500 text-sm">Manage monthly payroll runs and disbursements</p></div>
      <button onClick={()=>{setView("form");setForm({})}} className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-lg shadow-lg hover:opacity-90 transition shrink-0" style={{backgroundColor:A}}>{Ico.plus} New Payroll Run</button>
    </div>
    <SearchBar value={search} onChange={setSearch} statuses={["Pending","Approved","Processed","Draft"]} statusFilter={statusF} onStatusChange={setStatusF}/>
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200 text-left">{["Reference","Period","Run Date","Employees","Total Gross","Total Net","Prepared By","Status"].map(h=><th key={h} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
    <tbody>{filtered.map((r,i)=><tr key={i} className="border-t border-gray-100 hover:bg-gray-50/60"><td className="px-5 py-3 font-mono text-xs text-gray-500">{r.ref}</td><td className="px-5 py-3 text-gray-800 font-medium">{r.period}</td><td className="px-5 py-3 text-gray-500">{r.runDate}</td><td className="px-5 py-3 text-gray-800">{r.employees}</td><td className="px-5 py-3 text-gray-800 font-semibold">₦{r.totalGross.toLocaleString()}</td><td className="px-5 py-3 font-bold" style={{color:A}}>₦{r.totalNet.toLocaleString()}</td><td className="px-5 py-3 text-gray-600">{r.preparedBy}</td><td className="px-5 py-3"><Badge status={r.status}/></td></tr>)}</tbody></table></div></div>
  </div>)
}

/* ═══════════════════════════════════════════
   MAIN APP SHELL
   ═══════════════════════════════════════════ */
const MODULES=[
  {key:"home",label:"Home",ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>},
  {key:"divider",label:"HR Management"},
  {key:"employees",label:"Employee Profile",ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>},
  {key:"leave",label:"Leave Requests",ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>},
  {key:"records",label:"Employee Records",ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>},
  {key:"policies",label:"HR Policies",ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>},
  {key:"divider2",label:"Compensation"},
  {key:"payslip",label:"Pay Slip",ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>},
  {key:"payroll",label:"Payroll",ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>},
];

export default function HRManagement(){
  const [active,setActive]=useState("home");
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const nav=(k)=>{setActive(k);setSidebarOpen(false)};

  const CARDS=[
    {key:"employees",label:"Employee Profile",desc:"Staff profiles & records",ico:MODULES.find(m=>m.key==="employees").ico},
    {key:"leave",label:"Leave Requests",desc:"Leave applications & approvals",ico:MODULES.find(m=>m.key==="leave").ico},
    {key:"records",label:"Employee Records",desc:"Document vault",ico:MODULES.find(m=>m.key==="records").ico},
    {key:"policies",label:"HR Policies",desc:"Policy library & acknowledgements",ico:MODULES.find(m=>m.key==="policies").ico},
    {key:"payslip",label:"Pay Slip",desc:"Monthly pay slip viewer",ico:MODULES.find(m=>m.key==="payslip").ico},
    {key:"payroll",label:"Payroll",desc:"Payroll runs & disbursements",ico:MODULES.find(m=>m.key==="payroll").ico},
  ];

  return(
    <div className="flex h-screen bg-gray-50 overflow-hidden" style={{fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      {sidebarOpen&&<div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={()=>setSidebarOpen(false)}/>}

      {/* Sidebar */}
      <aside className={`fixed lg:static z-40 top-0 left-0 h-full w-60 flex flex-col transform transition-transform duration-300 ${sidebarOpen?"translate-x-0":"-translate-x-full lg:translate-x-0"}`} style={{backgroundColor:"#1E1B2E"}}>
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{background:A}}>PG</div>
          <div><p className="text-white font-bold text-sm leading-tight">Portland Gas</p><p className="text-xs" style={{color:A}}>Operations</p></div>
        </div>
        <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-0.5">
          {MODULES.map((m,i)=>{
            if(m.key.startsWith("divider"))return <div key={i} className="pt-4 pb-1 px-1"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{m.label}</p></div>;
            const act=active===m.key;
            return <button key={m.key} onClick={()=>nav(m.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${act?"text-white":"text-gray-400 hover:text-white hover:bg-white/5"}`} style={act?{backgroundColor:A}:{}}>{m.ico}{m.label}</button>;
          })}
        </nav>
        <div className="px-5 py-4 border-t border-white/10 flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold">N</div><span className="text-gray-300 text-sm">Logout</span></div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3"><button onClick={()=>setSidebarOpen(true)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600">{Ico.menu}</button><span className="text-sm font-semibold text-gray-700">Portland Gas Operations — HR</span></div>
          <button className="text-gray-400 hover:text-gray-600">{Ico.bell}</button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {active==="home"&&(<div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1><p className="text-gray-500 mb-8">What would you like to work on today?</p>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Human Resources</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{CARDS.map(c=>(<button key={c.key} onClick={()=>nav(c.key)} className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:shadow-md hover:border-purple-200 transition-all group"><div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{backgroundColor:`${A}15`,color:A}}>{c.ico}</div><p className="font-bold text-gray-900 group-hover:text-purple-700 transition">{c.label}</p><p className="text-sm text-gray-400 mt-1">{c.desc}</p></button>))}</div>
          </div>)}
          {active==="employees"&&<EmployeeProfile/>}
          {active==="leave"&&<LeaveRequests/>}
          {active==="records"&&<EmployeeRecords/>}
          {active==="policies"&&<HRPolicies/>}
          {active==="payslip"&&<PaySlip/>}
          {active==="payroll"&&<Payroll/>}
        </div>
      </main>
    </div>
  )
}
