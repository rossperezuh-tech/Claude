'use client';

import { useState } from 'react';
import Link from 'next/link';

const services = [
  {
    id: 'startup-lawyer',
    name: 'Legal Practices',
    industry: 'Business Law',
    icon: '⚖️',
    tagline: 'Contract Intelligence + Deal Tracking',
    description: 'For startup business lawyers handling corporate docs, funding rounds, and ongoing compliance.',
    tools: [
      'Contract Analyzer: Upload any doc → Claude extracts obligations, risks, missing clauses',
      'Deal Tracker: Track funding/acquisition status with automated checklists',
      'Cap Table Analyzer: Equity structure review and vesting schedule optimization',
      'Compliance Checklist: Auto-generate requirements based on entity type/jurisdiction'
    ],
    outcomes: ['4-6 hours saved per week on doc review', 'Fewer missed deadlines/obligations', 'Faster client turnaround'],
    timelineWeeks: 2,
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'real-estate-agent',
    name: 'Real Estate Agents',
    industry: 'Real Estate',
    icon: '🏠',
    tagline: 'Listing Intelligence + Client CRM',
    description: 'For agents juggling multiple listings, buyers, and sellers across markets.',
    tools: [
      'Listing Analyzer: Draft listing → Claude generates compelling copy, pricing analysis, market angles',
      'Comparable Analysis: Automated comps pulls + pricing recommendations',
      'Buyer Matcher: Track buyer preferences → auto-generate property recommendations',
      'Transaction Dashboard: Closing checklist + deadline tracking per deal'
    ],
    outcomes: ['Listings generate more interest 30% faster', 'Close deals 1-2 weeks sooner', '8+ hours saved on admin/comps'],
    timelineWeeks: 2,
    color: 'from-amber-500 to-amber-600'
  },
  {
    id: 'ecommerce',
    name: 'E-commerce Store Owners',
    industry: 'Retail',
    icon: '🛒',
    tagline: 'Product Optimizer + Review Analyzer',
    description: 'For DTC brands, multi-SKU shops, and marketplace sellers optimizing conversion.',
    tools: [
      'Product Listing Optimizer: Batch rewrite descriptions for conversion + SEO',
      'Pricing Analyzer: Margin analysis → Claude suggests optimal pricing per product',
      'Review Sentiment Analyzer: Customer feedback trends → improvement roadmap',
      'Competitor Monitor: Track pricing/copy changes → auto-alerts'
    ],
    outcomes: ['Conversion rate +15-25%', 'Product copy written 10x faster', 'Revenue-per-listing +20%'],
    timelineWeeks: 3,
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'consultant',
    name: 'Consultants & Agencies',
    industry: 'Professional Services',
    icon: '💼',
    tagline: 'Proposal Generator + Project Dashboard',
    description: 'For consulting firms, agencies, and freelancers managing multiple client projects.',
    tools: [
      'Proposal Generator: Client brief → Claude auto-drafts scope, timeline, deliverables, pricing',
      'Project Tracker: Active projects → auto-generates client status updates + timeline alerts',
      'Time Analyzer: Billable hours → invoice auto-generation + profitability insights',
      'Report Generator: Project results → Claude writes impact summary + next-phase recommendations'
    ],
    outcomes: ['Proposals written 3x faster', 'Never miss a deadline', 'Bills generated automatically'],
    timelineWeeks: 3,
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'restaurant',
    name: 'Restaurants & Food Businesses',
    industry: 'Food & Beverage',
    icon: '🍽️',
    tagline: 'Menu Optimizer + Review Responder',
    description: 'For restaurants, cafes, and food brands managing menu, staff, and customer feedback.',
    tools: [
      'Menu Optimizer: Upload current menu → Claude suggests pricing, high-margin dishes, seasonal rotations',
      'Cost Analyzer: Food costs per dish → margin analysis + pricing recommendations',
      'Review Responder: Customer reviews → Claude drafts professional responses',
      'Staff Scheduler: Team availability → Claude optimizes schedule + spots understaffing'
    ],
    outcomes: ['Gross margin +8-12%', 'All reviews responded to within 24 hours', 'Scheduling conflicts eliminated'],
    timelineWeeks: 2,
    color: 'from-red-500 to-red-600'
  },
  {
    id: 'fitness',
    name: 'Fitness Studios & Trainers',
    industry: 'Health & Wellness',
    icon: '💪',
    tagline: 'Workout Generator + Member Retention',
    description: 'For gyms, studios, and coaches scaling personalized programming and retention.',
    tools: [
      'Workout Program Generator: Client goals → Claude builds custom plans + progressions',
      'Member Retention Tracker: Churn risk detection + auto-generated win-back messaging',
      'Class Marketing: Weekly schedule → Claude creates promotional copy + email sequences',
      'Progress Analyzer: Member check-ins → Claude suggests form cues + programming adjustments'
    ],
    outcomes: ['Member retention +20%', 'Workouts personalized in 5 minutes vs. 30', 'Churn alerts 2 weeks before cancellation'],
    timelineWeeks: 2,
    color: 'from-pink-500 to-pink-600'
  },
  {
    id: 'property-manager',
    name: 'Real Estate Investors',
    industry: 'Real Estate Investment',
    icon: '🏢',
    tagline: 'Deal Analyzer + Lease Review',
    description: 'For landlords, property managers, and investors tracking portfolio, leases, and maintenance.',
    tools: [
      'Deal Analyzer: Property listing → Claude valuates, flags risks, identifies investment angle',
      'Lease Reviewer: Tenant lease → Claude flags unfavorable terms, compliance issues',
      'Maintenance Triage: Work orders → Claude prioritizes by urgency + cost estimates',
      'Rent Roll Manager: Occupancy tracker → auto-generates tenant communications'
    ],
    outcomes: ['Avoid 1-2 risky deals per year via flags', 'Maintenance costs -15% (prioritization)', 'Lease review 10x faster'],
    timelineWeeks: 2,
    color: 'from-slate-600 to-slate-700'
  },
  {
    id: 'recruiting',
    name: 'Staffing & Recruiting',
    industry: 'Human Resources',
    icon: '👥',
    tagline: 'Candidate Scorer + Job Description Generator',
    description: 'For recruiters, hiring managers, and staffing firms screening, sourcing, and placing talent.',
    tools: [
      'Candidate Scorer: Resume upload → Claude ranks fit, flags red flags, generates interview questions',
      'Job Description Generator: Role brief → Claude writes compelling JD + screening criteria',
      'Interview Prep: Candidate profile → Claude suggests tailored interview questions + evaluation rubric',
      'Offer Letter Generator: Role/salary → Claude auto-generates offer letter with benefits, equity'
    ],
    outcomes: ['Resumes screened 5x faster', 'Hire faster (better-qualified candidates)', 'Reduce bad hires via red flags caught'],
    timelineWeeks: 2,
    color: 'from-cyan-500 to-cyan-600'
  },
  {
    id: 'accounting',
    name: 'Accounting & Bookkeeping',
    industry: 'Finance',
    icon: '📊',
    tagline: 'Expense Categorizer + Tax Planner',
    description: 'For accountants, bookkeepers, and CPAs managing client financials and tax planning.',
    tools: [
      'Expense Categorizer: Receipt/invoice → Claude auto-categorizes + flags unusual expenses',
      'Tax Planner: Client financials → Claude identifies deductions + planning opportunities',
      'Client Meeting Prep: Year-to-date numbers → Claude generates talking points + recommendations',
      'Financial Report Generator: Raw data → Claude produces polished client reports + narratives'
    ],
    outcomes: ['Tax planning uncovers $5K-$20K client savings', 'Data entry time -30%', 'Client meetings 50% more prepared'],
    timelineWeeks: 3,
    color: 'from-emerald-500 to-emerald-600'
  },
  {
    id: 'marketing-agency',
    name: 'Marketing Agencies & Freelancers',
    industry: 'Marketing',
    icon: '📢',
    tagline: 'Campaign Strategist + Copy Accelerator',
    description: 'For agencies and freelancers scaling campaign strategy, creative, and client reporting.',
    tools: [
      'Campaign Strategy Generator: Client brief + budget → Claude creates strategy doc + deliverables',
      'Copy Accelerator: Product/service → Claude generates ad copy, email sequences, landing page',
      'Client Reporting: Campaign metrics → Claude produces analysis + next-month recommendations',
      'Content Calendar: Brand voice + content pillars → Claude generates 4-week content plan'
    ],
    outcomes: ['Campaigns created 3x faster', 'Copy quality +30% (A/B testing)', 'Clients get better reporting = higher retention'],
    timelineWeeks: 3,
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 'nonprofit',
    name: 'Nonprofits & Grant Writers',
    industry: 'Nonprofit',
    icon: '🤝',
    tagline: 'Grant Proposal Generator + Donor Tracker',
    description: 'For nonprofits and development teams writing grants, managing donors, and reporting impact.',
    tools: [
      'Grant Proposal Generator: Funding opportunity + mission → Claude drafts proposal narrative',
      'Donor Tracker: Donor database + giving history → Claude suggests next ask + messaging',
      'Impact Report: Program outcomes + beneficiary stories → Claude writes compelling narrative',
      'Donor Communication: Event/milestone → Claude generates thank-you notes and impact updates'
    ],
    outcomes: ['Proposals written 5x faster, higher acceptance rate', 'Donor retention +25%', 'More strategic funding pipeline'],
    timelineWeeks: 3,
    color: 'from-teal-500 to-teal-600'
  },
  {
    id: 'contractor',
    name: 'Contractors & Construction',
    industry: 'Construction',
    icon: '🔨',
    tagline: 'Bid Analyzer + Compliance Checker',
    description: 'For contractors and construction firms managing bids, compliance, and client communication.',
    tools: [
      'Bid Analyzer: Competing bids → Claude analyzes pricing, margins, and risk flags',
      'Compliance Checker: Project type → Claude generates safety/permit/insurance checklist',
      'Client Status Generator: Project progress → Claude auto-drafts weekly owner updates',
      'Scope Analyzer: Change order request → Claude flags scope creep, revenue risk'
    ],
    outcomes: ['Win more bids via smarter pricing', 'Zero compliance violations (automated checklists)', 'Client satisfaction +40%'],
    timelineWeeks: 2,
    color: 'from-yellow-600 to-yellow-700'
  },
  {
    id: 'saas-sales',
    name: 'SaaS Sales & Closers',
    industry: 'SaaS / Tech',
    icon: '🚀',
    tagline: 'Deal Analyzer + Email Sequence',
    description: 'For sales teams and closers managing pipeline, forecasting, and outreach.',
    tools: [
      'Deal Analyzer: CRM data → Claude surfaces at-risk deals + suggests recovery actions',
      'Email Sequence Generator: Prospect profile → Claude creates personalized follow-up sequence',
      'Proposal Customizer: Demo notes → Claude generates custom proposal matching pain points',
      'Win/Loss Analyzer: Closed deals → Claude identifies patterns (why won vs. lost)'
    ],
    outcomes: ['Close rate +15%', 'Sales cycle shortened 1-2 weeks', 'Predictable forecasting via pattern analysis'],
    timelineWeeks: 2,
    color: 'from-indigo-500 to-indigo-600'
  }
];

export default function ServicesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = services.find(s => s.id === selectedId);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Steadyhand AI Consulting
            </h1>
            <p className="text-slate-400 text-sm mt-1">Custom Claude assistants for your business</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 text-slate-300 hover:text-white text-sm font-medium transition"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold mb-4">
            AI-Powered Solutions for Every Business
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            We build custom Claude assistants that automate your workflow, save hours per week, and accelerate growth.
            Click any industry to see what's possible.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedId(service.id)}
              className={`text-left p-6 rounded-lg border-2 transition-all duration-200 ${
                selectedId === service.id
                  ? `border-blue-400 bg-slate-800 shadow-lg shadow-blue-500/20`
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{service.icon}</span>
                <span className="text-xs font-semibold text-slate-400 bg-slate-700 px-2 py-1 rounded">
                  {service.industry}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1">{service.name}</h3>
              <p className="text-slate-400 text-sm mb-3">{service.tagline}</p>
              <div className="text-xs text-slate-500">
                {service.timelineWeeks} week build →
              </div>
            </button>
          ))}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center md:justify-end">
            <div className="w-full md:w-[600px] bg-slate-900 border-l border-slate-700 rounded-t-lg md:rounded-lg max-h-[90vh] overflow-y-auto">
              {/* Close button */}
              <button
                onClick={() => setSelectedId(null)}
                className="sticky top-0 right-6 pt-4 text-slate-400 hover:text-white text-2xl font-light"
              >
                ✕
              </button>

              <div className={`h-32 bg-gradient-to-r ${selected.color} relative -mt-8`}>
                <div className="absolute bottom-4 left-6 text-5xl">{selected.icon}</div>
              </div>

              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2">{selected.name}</h2>
                <p className="text-blue-400 font-semibold mb-4">{selected.tagline}</p>
                <p className="text-slate-300 mb-6">{selected.description}</p>

                {/* Tools */}
                <div className="mb-6">
                  <h3 className="font-bold text-sm uppercase text-slate-400 mb-3">What We Build</h3>
                  <ul className="space-y-2">
                    {selected.tools.map((tool, i) => (
                      <li key={i} className="text-sm text-slate-300 flex gap-3">
                        <span className="text-blue-400 font-bold">•</span>
                        <span>{tool}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Outcomes */}
                <div className="mb-6">
                  <h3 className="font-bold text-sm uppercase text-slate-400 mb-3">Expected Outcomes</h3>
                  <ul className="space-y-2">
                    {selected.outcomes.map((outcome, i) => (
                      <li key={i} className="text-sm text-green-400 flex gap-3">
                        <span className="font-bold">✓</span>
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Timeline & CTA */}
                <div className="border-t border-slate-700 pt-4">
                  <p className="text-sm text-slate-400 mb-4">
                    <strong>Timeline:</strong> {selected.timelineWeeks} weeks | <strong>Model:</strong> Custom build for your business
                  </p>
                  <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-lg transition">
                    Schedule Discovery Call
                  </button>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="w-full mt-2 text-slate-300 hover:text-white py-2 text-sm transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer CTA */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-12 mt-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold mb-3">Ready to automate your business?</h3>
          <p className="text-slate-400 mb-6">
            We custom-build Claude assistants that integrate with your existing workflow in 2-3 weeks.
          </p>
          <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold rounded-lg transition">
            Let's Talk
          </button>
        </div>
      </footer>
    </div>
  );
}
