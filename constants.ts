import { LeadStatus } from './types';

export const STATUS_COLORS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: 'bg-blue-100 text-blue-800',
  [LeadStatus.CONTACTED]: 'bg-yellow-100 text-yellow-800',
  [LeadStatus.NOT_RESPONDED]: 'bg-orange-100 text-orange-800',
  [LeadStatus.RESPONDED]: 'bg-purple-100 text-purple-800',
  [LeadStatus.QUALIFIED]: 'bg-indigo-100 text-indigo-800',
  [LeadStatus.LOST]: 'bg-red-100 text-red-800',
  [LeadStatus.WON]: 'bg-green-100 text-green-800',
};

export const DEMO_CSV = `Name,Email,Company,Role,Industry,City
Alice Johnson,alice@technova.com,TechNova,CTO,Software,San Francisco
Bob Smith,bob.smith@construct.io,Construct IO,Project Manager,Construction,New York
Charlie Davis,charlie@finspark.net,FinSpark,VP Sales,Finance,London
Diana Prince,diana@themyscira.gov,Justice League,Head of Security,Government,Washington DC
Evan Wright,evan@writegood.com,WriteGood,Editor,Publishing,Chicago
Fiona Gallagher,fiona@chicago.net,Patsy's Pies,Owner,Food & Bev,Chicago
George Miller,george@maxfilms.com,Max Films,Director,Entertainment,Los Angeles
Hannah Lee,hannah@biocore.org,BioCore,Researcher,Biotech,Boston`;