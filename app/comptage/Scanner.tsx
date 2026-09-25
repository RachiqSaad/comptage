"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { getLocationScans,scanEan,savePhoto,validateLocation } from "./actions";
type Aisle={id:string;code:string;locations:{id:string;code:string}[]};
type Scan={id:string;ean:string;known:boolean;duplicate?:boolean;article:{article_code:string;designation:string}|null;photo?:string};
export default function Scanner({aisles,depot,agent,initialAisle}:{aisles:Aisle[];depot:string;agent:string;initialAisle:string}){const [aisleId,setAisleId]=useState(initialAisle),aisle=aisles.find(a=>a.id===aisleId)||aisles[0];const [locationId,setLocationId]=useState(aisle?.locations[0]?.id||"");const [items,setItems]=useState<Scan[]>([]);const [ean,setEan]=useState("");const [message,setMessage]=useState("");const [busy,startTransition]=useTransition();const input=useRef<HTMLInputElement>(null);const scanPending=useRef(false);const location=useMemo(()=>aisle?.locations.find(l=>l.id===locationId),[aisle,locationId]);useEffect(()=>{if(!aisle)return;setLocationId(aisle.locations[0]?.id||"");setItems([]);setMessage("")},[aisleId]);useEffect(()=>{if(!locationId)return;let active=true;getLocationScans(locationId).then(rows=>{if(active)setItems(rows as Scan[])});input.current?.focus();return()=>{active=false}},[locationId]);
async function submitScan(value:string){
  const cleaned=value.trim();
  if(!cleaned||!locationId||scanPending.current)return;
  scanPending.current=true;
  setMessage("");
  const f=new FormData();f.set("ean",cleaned);f.set("location",locationId);
  startTransition(async()=>{
    try{
      const result=await scanEan(f);
      if("error" in result){setMessage(result.error||"Erreur de scan.");return}
      setItems(items=>{
        const previous=items.find(item=>item.id===result.id);
        return [{...previous,...result,article:result.article||null},...items.filter(item=>item.id!==result.id)];
      });
      setMessage(result.duplicate?"Article déjà scanné à cet emplacement.":"Scan enregistré.");
      setEan("");
    }catch{
      setMessage("Erreur : scan non confirmé. Vérifiez la connexion puis réessayez.");
    }finally{
      scanPending.current=false;
      input.current?.focus();
    }
  });
}
function upload(id:string,file?:File){if(!file)return;if(file.size>4*1024*1024){setMessage("Erreur : la photo dépasse 4 Mo. Réduisez sa taille puis réessayez.");return;}const f=new FormData();f.set("presence",id);f.set("photo",file);startTransition(async()=>{const r=await savePhoto(f);if("error"in r){setMessage(r.error||"Photo non enregistrée");return}setItems(v=>v.map(x=>x.id===id?{...x,photo:r.url}:x));setMessage("Photo enregistrée")})}
function nextLocation(){const f=new FormData();f.set("location",locationId);startTransition(async()=>{const r=await validateLocation(f);if("error"in r){setMessage(r.error||"Erreur");return}setItems([]);setMessage("Emplacement validé");if(r.next)setLocationId(r.next.id);else{setLocationId("");setMessage(`Travée ${r.aisle} terminée. Choisissez la travée suivante.`)}})}
if(!aisles.length)return <section className="card"><h2>Aucune travée configurée</h2><p className="muted">Demandez à l’administrateur de créer les travées du dépôt.</p></section>;
return <><section className="card"><div className="eyebrow">{depot} · Agent {agent}</div><label className="label" htmlFor="aisle">Choisir la travée</label><select id="aisle" className="select" value={aisleId} onChange={e=>setAisleId(e.target.value)}>{aisles.map(a=><option key={a.id} value={a.id}>{a.code}</option>)}</select><div className="eyebrow" style={{marginTop:22}}>Emplacement en cours</div><div className="big">{location?.code||"Travée terminée"}</div><p className="muted">Scannez chaque article présent. Aucun relevé de quantité.</p></section>{location&&<><section className="card"><form onSubmit={e=>{e.preventDefault();void submitScan(input.current?.value||ean)}}><label className="label" htmlFor="ean">EAN article</label><input ref={input} id="ean" className="input scan" inputMode="numeric" autoComplete="off" value={ean} onChange={e=>setEan(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"||(e.key==="Tab"&&e.currentTarget.value.trim())){e.preventDefault();void submitScan(e.currentTarget.value)}}} placeholder="Scanner le code-barres"/><button className="btn" style={{marginTop:12}} disabled={busy||!ean.trim()}>Ajouter la présence</button></form>{message&&<p className={message.toLowerCase().includes("erreur")||message.includes("Configurez")||message.includes("obligatoire")?"error":"ok"}>{message}</p>}</section><section className="card"><div className="row" style={{alignItems:"center"}}><h2 style={{flex:2}}>Articles à cet emplacement</h2><span className="pill">{items.length}</span></div>{items.length===0?<p className="muted">Scannez les articles, puis validez l’emplacement.</p>:<ul className="list">{items.map((it,i)=><li key={it.id}><div className="row" style={{alignItems:"start"}}><div style={{flex:3}}><b>{it.known?it.article?.article_code:"EAN non reconnu"}</b><br/><span className="muted">{it.known?it.article?.designation:it.ean}{it.duplicate?" · déjà scanné":""}</span>{it.photo&&<div className="ok">Photo d’étiquette ajoutée</div>}</div>{!it.known&&!it.photo&&<div className="photo-wrap" style={{flex:1}}><button className="btn secondary" type="button">📷 Photo</button><input className="photo" type="file" accept="image/*" capture="environment" aria-label="Prendre une photo de l’étiquette" onChange={e=>upload(it.id,e.target.files?.[0])}/></div>}</div></li>)}</ul>}</section><section className="card"><button className="btn green" disabled={busy} onClick={nextLocation}>Valider {location.code} et passer au suivant</button></section></>}</>}
