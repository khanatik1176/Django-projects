"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import { ChatWidget } from "@/components/landing/ChatWidget";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.12 * i,
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const stats = [
  { value: "5", label: "Warehouses across Dhaka, Chattogram & Sylhet" },
  { value: "24+", label: "FMCG SKUs with BDT cost & selling prices" },
  { value: "6", label: "Local distributors & wholesale suppliers" },
  { value: "৳", label: "Purchase orders, sales orders & stock in one system" },
];

const workflow = [
  {
    step: "01",
    title: "Catalog your products",
    body: "Add SKUs, categories, brands, and suppliers with cost and selling prices in BDT.",
    icon: Package,
  },
  {
    step: "02",
    title: "Receive from suppliers",
    body: "Create purchase orders, submit to suppliers, and receive stock into the right warehouse.",
    icon: ClipboardList,
  },
  {
    step: "03",
    title: "Reserve & fulfill sales",
    body: "Confirm sales orders to reserve stock, then fulfill shipments with full traceability.",
    icon: Truck,
  },
  {
    step: "04",
    title: "Monitor & replenish",
    body: "Use the dashboard and low-stock alerts to reorder before shelves run empty.",
    icon: BarChart3,
  },
];

const features = [
  {
    icon: Warehouse,
    title: "Multi-warehouse visibility",
    body: "Track on-hand, reserved, and available quantities across Dhaka, Chattogram, Sylhet, and branch stores from one dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Auditable stock movements",
    body: "Every receipt, issue, adjustment, and transfer records quantity before and after — so finance and ops stay aligned.",
  },
  {
    icon: ClipboardList,
    title: "Purchase order workflow",
    body: "Draft POs, submit to suppliers, partially receive lines, and auto-update product cost prices on receipt.",
  },
  {
    icon: Truck,
    title: "Sales order fulfillment",
    body: "Reserve inventory on confirmation, fulfill line by line, and release reservations automatically on cancellation.",
  },
  {
    icon: Boxes,
    title: "Product master data",
    body: "Organize products by category, brand, and supplier with barcodes, units of measure, and reorder levels.",
  },
  {
    icon: Users,
    title: "Team-ready access",
    body: "Secure login, role-friendly workflows, and a calm interface your warehouse and office teams can adopt quickly.",
  },
];

const testimonials = [
  {
    quote:
      "We replaced three spreadsheets with Bhandar. Our Motijheel and Uttara teams finally see the same stock numbers.",
    name: "Rahim Uddin",
    role: "Operations Manager, Dhaka Distributors",
  },
  {
    quote:
      "Purchase receipts and sales fulfillment in one place saved us hours every week during peak season.",
    name: "Nusrat Ahmed",
    role: "Inventory Lead, Chattogram Trading Co.",
  },
  {
    quote:
      "Low-stock alerts alone paid for the switch. We reorder before retail shelves go empty.",
    name: "Karim Hassan",
    role: "Store Owner, Sylhet Retail Group",
  },
];

const faqs = [
  {
    q: "Is Bhandar built for Bangladesh businesses?",
    a: "Yes. Bhandar uses BDT pricing, Asia/Dhaka timezone, and workflows suited to local distributors, wholesalers, and multi-branch retailers.",
  },
  {
    q: "Can I manage more than one warehouse?",
    a: "Absolutely. Create warehouses for each hub or branch, transfer stock between them, and view per-location availability.",
  },
  {
    q: "How do purchase and sales orders work?",
    a: "Purchase orders track inbound supplier stock; sales orders track outbound customer demand with reservation and fulfillment steps.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. Sign up free and explore the dashboard. Upgrade later when your team needs advanced features.",
  },
];

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#workflow" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  Company: [
    { label: "About", href: "#about" },
    { label: "Contact", href: "mailto:hello@bhandar.app" },
    { label: "Careers", href: "mailto:careers@bhandar.app" },
    { label: "Blog", href: "#" },
  ],
  Support: [
    { label: "Help center", href: "#faq" },
    { label: "Chat with us", href: "#" },
    { label: "support@bhandar.app", href: "mailto:support@bhandar.app" },
    { label: "Status", href: "#" },
  ],
  Legal: [
    { label: "Privacy policy", href: "#" },
    { label: "Terms of service", href: "#" },
    { label: "Security", href: "#" },
    { label: "Cookie policy", href: "#" },
  ],
};

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a1f17] text-white">
      <section className="relative min-h-dvh grain mesh-bg">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1920&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1f17] via-[#0a1f17]/55 to-transparent" />

        <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-3 py-5 sm:px-4">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0b6e4f] text-sm font-bold">
              ভ
            </span>
            <span className="font-display text-xl tracking-tight sm:text-2xl">Bhandar</span>
          </motion.div>

          <motion.nav
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hidden items-center gap-6 text-sm text-white/70 md:flex"
          >
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#workflow" className="transition hover:text-white">How it works</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center gap-2 sm:gap-3"
          >
            <Link
              href="/login"
              className="rounded-full px-3 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white sm:px-4"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-[#0a1f17] transition hover:bg-[#e6f4ee] sm:px-5"
            >
              Sign up
            </Link>
          </motion.div>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-5rem)] max-w-6xl flex-col justify-end px-3 pb-16 pt-20 sm:px-4 sm:pb-24">
          <motion.p
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mb-4 font-display text-5xl leading-[0.95] tracking-tight text-white sm:text-7xl md:text-8xl lg:text-9xl"
          >
            Bhandar
          </motion.p>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="max-w-2xl text-xl font-medium leading-snug text-white/90 sm:text-2xl md:text-3xl"
          >
            Stock clarity for every warehouse from Motijheel to Chattogram.
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base"
          >
            Track products, purchase orders, sales fulfillment, transfers, and low-stock
            alerts in one workspace built for Bangladesh retailers and distributors.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0b6e4f] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-[#085340]"
            >
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-3.5 text-sm font-medium text-white/90 transition hover:border-white/50 hover:bg-white/5"
            >
              Sign in to dashboard
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0d241c] px-3 py-12 sm:px-4">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-3xl text-[#5ee0b0] sm:text-4xl">{stat.value}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="bg-[#f4f6f3] px-3 py-20 text-[#14201a] sm:px-4 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0b6e4f]">
              Built for local ops
            </p>
            <h2 className="font-display mt-3 text-3xl leading-tight sm:text-5xl">
              From supplier receipt to shopfloor issue — without spreadsheet chaos.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[#5c6b63]">
              Bhandar brings together product catalog, warehouse stock, purchase orders,
              sales orders, and movement history in a single system. Whether you run a
              wholesale hub in Dhaka or retail branches across the country, your team gets
              one source of truth for what is on hand, reserved, and on the way.
            </p>
          </motion.div>

          <div id="features" className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Boxes,
                title: "Multi-warehouse stock",
                body: "See on-hand and reserved quantities across Dhaka, Chattogram, and branch stores.",
              },
              {
                icon: ShieldCheck,
                title: "Auditable movements",
                body: "Every receipt, issue, and transfer leaves a clear trail your team can trust.",
              },
              {
                icon: MapPin,
                title: "Bangladesh-ready",
                body: "BDT pricing, local suppliers, and workflows that match how distribution actually runs.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="border-t border-[#d8e0d9] pt-6"
              >
                <item.icon className="mb-4 h-6 w-6 text-[#0b6e4f]" strokeWidth={1.75} />
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5c6b63]">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-white px-3 py-20 text-[#14201a] sm:px-4 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0b6e4f]">
              How it works
            </p>
            <h2 className="font-display mt-3 text-3xl leading-tight sm:text-5xl">
              A clear path from catalog to fulfilled order.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {workflow.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="rounded-2xl border border-[#e3ebe5] p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="font-display text-2xl text-[#0b6e4f]/40">{item.step}</span>
                  <div>
                    <item.icon className="mb-3 h-5 w-5 text-[#0b6e4f]" />
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#5c6b63]">{item.body}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4f6f3] px-3 py-20 text-[#14201a] sm:px-4 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0b6e4f]">
              Platform features
            </p>
            <h2 className="font-display mt-3 text-3xl leading-tight sm:text-5xl">
              Everything your inventory team needs day to day.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <item.icon className="mb-4 h-6 w-6 text-[#0b6e4f]" strokeWidth={1.75} />
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5c6b63]">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0a1f17] px-3 py-20 sm:px-4 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5ee0b0]">
            Trusted by teams
          </p>
          <h2 className="font-display mt-3 max-w-2xl text-3xl leading-tight text-white sm:text-5xl">
            Distributors and retailers across Bangladesh rely on clearer stock.
          </h2>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <p className="text-sm leading-relaxed text-white/80">&ldquo;{item.quote}&rdquo;</p>
                <p className="mt-5 text-sm font-semibold text-white">{item.name}</p>
                <p className="text-xs text-white/50">{item.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-white px-3 py-20 text-[#14201a] sm:px-4 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0b6e4f]">
              Pricing
            </p>
            <h2 className="font-display mt-3 text-3xl sm:text-5xl">Start free. Scale when ready.</h2>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {[
              {
                name: "Starter",
                price: "Free",
                detail: "For small teams getting off spreadsheets",
                perks: ["1 warehouse", "Unlimited products", "Purchase & sales orders", "Stock movements"],
              },
              {
                name: "Growth",
                price: "৳2,499",
                detail: "Per month · most popular for distributors",
                perks: ["Up to 5 warehouses", "Low-stock alerts", "Transfers & reports", "Email support"],
                highlight: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                detail: "For large multi-branch operations",
                perks: ["Unlimited warehouses", "Dedicated onboarding", "SLA & priority support", "Custom integrations"],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-8 ${
                  plan.highlight
                    ? "border-[#0b6e4f] bg-[#f0faf5] shadow-lg"
                    : "border-[#e3ebe5] bg-white"
                }`}
              >
                <p className="text-sm font-semibold text-[#0b6e4f]">{plan.name}</p>
                <p className="font-display mt-2 text-4xl">{plan.price}</p>
                <p className="mt-2 text-sm text-[#5c6b63]">{plan.detail}</p>
                <ul className="mt-6 space-y-3">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm text-[#3d4a43]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0b6e4f]" />
                      {perk}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                    plan.highlight
                      ? "bg-[#0b6e4f] text-white hover:bg-[#085340]"
                      : "border border-[#d8e0d9] hover:border-[#0b6e4f] hover:text-[#0b6e4f]"
                  }`}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-[#f4f6f3] px-3 py-20 text-[#14201a] sm:px-4 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0b6e4f]">
            FAQ
          </p>
          <h2 className="font-display mt-3 text-3xl sm:text-5xl">Common questions</h2>

          <div className="mt-10 space-y-4">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-[#dce5df] bg-white p-5"
              >
                <summary className="cursor-pointer list-none font-semibold marker:content-none">
                  {item.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#5c6b63]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0b6e4f] px-3 py-16 sm:px-4 sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-3xl text-white sm:text-4xl">
              Ready to run inventory with confidence?
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/80 sm:text-base">
              Join teams across Bangladesh using Bhandar to keep stock accurate and orders moving.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#0a1f17] transition hover:bg-[#e6f4ee]"
          >
            Create free account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#081912] px-3 py-14 text-white sm:px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0b6e4f] text-sm font-bold">
                  ভ
                </span>
                <span className="font-display text-xl">Bhandar</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/55">
                Modern inventory management for Bangladesh retailers, wholesalers, and
                multi-branch distributors.
              </p>
              <p className="mt-4 text-sm text-white/45">Dhaka, Bangladesh</p>
            </div>

            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <p className="text-sm font-semibold text-white/90">{title}</p>
                <ul className="mt-4 space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-white/50 transition hover:text-white/85"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/40 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} Bhandar. All rights reserved.</p>
            <p>Inventory clarity from Motijheel to Chattogram.</p>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
