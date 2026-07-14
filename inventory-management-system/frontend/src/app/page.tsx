"use client";

import Link from "next/link";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  Banknote,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  History,
  MapPin,
  Package,
  Percent,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";
import { ChatWidget } from "@/components/landing/ChatWidget";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.7, ease },
  }),
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};

const highlights = [
  "Counter POS",
  "Hal Khata · উধার",
  "Cash · bKash · Nagad",
  "Multi-warehouse stock",
  "Purchase & receive",
  "Sales fulfill",
  "FEFO batches",
  "Near-expiry clearance",
  "Shop finance cashbook",
  "Stock transfers",
  "Low-stock alerts",
  "ABC reports",
  "Auditable movements",
  "Asia/Dhaka · BDT",
];

const modules = [
  {
    icon: ScanLine,
    title: "Counter POS",
    body: "Barcode checkout with cash, bKash, Nagad, or udhar — stock updates the moment you sell.",
  },
  {
    icon: Wallet,
    title: "Hal Khata",
    body: "Neighborhood credit ledger with limits, balances, and collections built for BD grocery shops.",
  },
  {
    icon: Warehouse,
    title: "Multi-warehouse",
    body: "On-hand, reserved, and available across hubs and branches with live health badges.",
  },
  {
    icon: Percent,
    title: "Clearance",
    body: "Near-expiry markdowns and dead-stock spotting so perishables leave shelves, not dumpsters.",
  },
  {
    icon: ShoppingCart,
    title: "Purchase orders",
    body: "Draft, submit, and partially receive from suppliers — cost prices update on receipt.",
  },
  {
    icon: Truck,
    title: "Sales orders",
    body: "Confirm to reserve, fulfill line by line, cancel to release — wholesale demand handled cleanly.",
  },
  {
    icon: ArrowLeftRight,
    title: "Transfers",
    body: "Move stock between Motijheel, Uttara, and depot locations without losing the audit trail.",
  },
  {
    icon: Banknote,
    title: "Shop finance",
    body: "Cashbook for every taka in or out — sales, udhar collections, rent, salary, and more.",
  },
  {
    icon: BarChart3,
    title: "Reports",
    body: "Stock valuation, ABC analysis, and movement summaries for owners who want numbers, not guesses.",
  },
  {
    icon: History,
    title: "Movements",
    body: "Immutable receipt, issue, adjustment, and transfer history with quantity before and after.",
  },
  {
    icon: Package,
    title: "Product master",
    body: "Categories, brands, barcodes, UOM, perishable flags, and reorder levels in BDT.",
  },
  {
    icon: Users,
    title: "Team access",
    body: "Pending signup approval, roles, and activity logs so the right people see the right work.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Catalog your shelf",
    body: "Add SKUs with barcodes, suppliers, BDT cost & sell, and perishable shelf life.",
    icon: Package,
  },
  {
    step: "02",
    title: "Receive from suppliers",
    body: "Purchase orders land in the right warehouse — partial receives and batches included.",
    icon: ClipboardList,
  },
  {
    step: "03",
    title: "Sell at the counter",
    body: "Scan at POS or fulfill wholesale orders. Pay with cash, bKash, Nagad, or udhar.",
    icon: ScanLine,
  },
  {
    step: "04",
    title: "Clear, transfer, replenish",
    body: "Move stock between hubs, clear near-expiry, and reorder before low-stock hits.",
    icon: ArrowLeftRight,
  },
];

const pillars = [
  {
    id: "pos",
    eyebrow: "Counter POS",
    title: "Scan. Sell. Stock adjusts itself.",
    body: "Walk-in sales sync inventory, finance, and Hal Khata in one atomic checkout — built for busy shop counters across Bangladesh.",
    points: [
      "Barcode / SKU search with live availability",
      "Cash · bKash · Nagad · উধার payment in one flow",
      "Confirmed sales order + fulfillment + payment log",
    ],
    visual: "pos" as const,
  },
  {
    id: "khata",
    eyebrow: "Hal Khata",
    title: "Know who owes the shop — every evening.",
    body: "Udhar is how neighborhood trade works. Bhandar tracks customer limits, outstanding balances, and collections without a separate notebook.",
    points: [
      "Customer credit limits (default ৳5,000)",
      "POS udhar sales raise balances instantly",
      "Collect payment and clear lines in Hal Khata",
    ],
    visual: "khata" as const,
  },
  {
    id: "clearance",
    eyebrow: "Clearance & FEFO",
    title: "Sell near-expiry before it becomes waste.",
    body: "Batch expiry, FEFO picking, clearance markdowns, and dead-stock alerts protect margin on grocery and FMCG shelves.",
    points: [
      "FEFO deduct on issue for perishable batches",
      "Suggested discount % for items expiring soon",
      "Dead stock with no movement for ~30 days",
    ],
    visual: "clearance" as const,
  },
];

const audience = [
  {
    title: "Grocery & kirana shops",
    body: "Counter POS, Hal Khata, and a taka cashbook that matches how you already sell.",
  },
  {
    title: "Wholesale distributors",
    body: "Purchase in, reserve & fulfill out, transfer between depots — with full movement history.",
  },
  {
    title: "Multi-branch retailers",
    body: "One inventory OS for Motijheel hub, Uttara branch, and every store in between.",
  },
];

const testimonials = [
  {
    quote:
      "We replaced three spreadsheets with Bhandar. Motijheel and Uttara finally see the same stock numbers — and POS closes the day correctly.",
    name: "Rahim Uddin",
    role: "Operations Manager, Dhaka Distributors",
  },
  {
    quote:
      "Hal Khata alone was worth it. We know every ওয়ালার balance, and collections flow straight into the cashbook.",
    name: "Nusrat Ahmed",
    role: "Inventory Lead, Chattogram Trading Co.",
  },
  {
    quote:
      "Clearance alerts on near-expiry yoghurt and dairy paid for the switch in the first month.",
    name: "Karim Hassan",
    role: "Store Owner, Sylhet Retail Group",
  },
];

const faqs = [
  {
    q: "Is Bhandar built for Bangladesh businesses?",
    a: "Yes. BDT pricing, Asia/Dhaka timezone, bKash & Nagad, Hal Khata udhar, and workflows suited to local distributors, wholesalers, and multi-branch retailers.",
  },
  {
    q: "Does Counter POS update stock automatically?",
    a: "Yes. Checkout creates a confirmed sales order, fulfills lines, records payment or credit, and logs the activity — inventory and finance stay aligned.",
  },
  {
    q: "What is Hal Khata?",
    a: "Hal Khata is Bhandar’s neighborhood credit ledger. Track customers, credit limits, outstanding balances, and collections — the digital form of shop udhar books.",
  },
  {
    q: "Can I manage more than one warehouse?",
    a: "Absolutely. Create hubs and branches, transfer stock, and view on-hand vs reserved per location.",
  },
  {
    q: "How do perishables and clearance work?",
    a: "Perishable products use batches with expiry. Issues follow FEFO. Clearance surfaces near-expiry markdown suggestions and dead stock with no recent movement.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. Sign up free, wait for admin approval if your team requires it, and explore the dashboard. Upgrade when you need Growth or Enterprise.",
  },
];

const footerLinks = {
  Product: [
    { label: "Modules", href: "#modules" },
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

function SectionTitle({
  eyebrow,
  title,
  subtitle,
  light = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  light?: boolean;
}) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className="max-w-3xl"
    >
      <motion.p
        variants={rise}
        className={`text-sm font-semibold uppercase tracking-[0.18em] ${
          light ? "text-[#5ee0b0]" : "text-[#0b6e4f]"
        }`}
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        variants={rise}
        className={`font-display mt-3 text-4xl leading-[1.05] sm:text-5xl lg:text-[3.25rem] ${
          light ? "text-white" : "text-[#14201a]"
        }`}
      >
        {title}
      </motion.h2>
      {subtitle ? (
        <motion.p
          variants={rise}
          className={`mt-4 max-w-xl text-base leading-relaxed ${
            light ? "text-white/58" : "text-[#5c6b63]"
          }`}
        >
          {subtitle}
        </motion.p>
      ) : null}
    </motion.div>
  );
}

function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
}: {
  value: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let frame = 0;
    const total = 36;
    const tick = () => {
      frame += 1;
      const t = frame / total;
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(value * eased));
      if (frame < total) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, value]);

  return (
    <span ref={ref}>
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}

function PosVisual() {
  const lines = [
    { name: "PRAN Drink 250ml", qty: 2, price: "৳48" },
    { name: "Fresh Atta 2kg", qty: 1, price: "৳120" },
    { name: "ACI Salt 1kg", qty: 3, price: "৳45" },
  ];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#0c261d]/95 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <div className="landing-shimmer pointer-events-none absolute inset-0" />
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-2">
          <ScanLine className="h-4 w-4 text-[#5ee0b0]" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
            Counter POS
          </span>
        </div>
        <span className="text-xs text-white/40">Motijheel Hub</span>
      </div>
      <div className="space-y-0 divide-y divide-white/8 px-0">
        {lines.map((line, i) => (
          <motion.div
            key={line.name}
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.45 }}
            className="flex items-center justify-between px-5 py-3.5 text-sm"
          >
            <div>
              <p className="font-medium text-white/90">{line.name}</p>
              <p className="text-xs text-white/40">Qty {line.qty}</p>
            </div>
            <p className="text-white/75">{line.price}</p>
          </motion.div>
        ))}
      </div>
      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/50">Total</p>
          <motion.p
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-2xl text-[#5ee0b0]"
          >
            ৳258
          </motion.p>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[11px] font-semibold uppercase tracking-wide">
          {["নগদ", "bKash", "Nagad", "উধার"].map((m, i) => (
            <motion.span
              key={m}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35 + i * 0.06 }}
              className={`rounded-lg border py-2 ${
                i === 0
                  ? "border-[#5ee0b0]/50 bg-[#5ee0b0]/15 text-[#5ee0b0]"
                  : "border-white/10 text-white/45"
              }`}
            >
              {m}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

function KhataVisual() {
  const rows = [
    { name: "করিম ভাই", balance: "৳2,450", limit: "৳5,000" },
    { name: "সাবিনা স্টোর", balance: "৳780", limit: "৳3,000" },
    { name: "রফিক হোলসেল", balance: "৳4,200", limit: "৳8,000" },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-[#d0dad3] bg-white shadow-[0_24px_60px_rgba(20,32,26,0.08)]">
      <div className="flex items-center justify-between border-b border-[#e3ebe5] bg-[#f7faf8] px-5 py-3">
        <div className="flex items-center gap-2 text-[#0b6e4f]">
          <Wallet className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">
            Hal Khata
          </span>
        </div>
        <span className="text-xs text-[#5c6b63]">Outstanding ৳7,430</span>
      </div>
      {rows.map((row, i) => (
        <motion.div
          key={row.name}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.45 }}
          className="flex items-center justify-between border-b border-[#eef2ef] px-5 py-4 last:border-0"
        >
          <div>
            <p className="font-medium text-[#14201a]">{row.name}</p>
            <p className="text-xs text-[#5c6b63]">Limit {row.limit}</p>
          </div>
          <p className="font-display text-xl text-[#0b6e4f]">{row.balance}</p>
        </motion.div>
      ))}
    </div>
  );
}

function ClearanceVisual() {
  const items = [
    { name: "Dairy Yoghurt 500g", days: "5 days", discount: "20% ছাড়", price: "৳64" },
    { name: "Bread Brown Loaf", days: "2 days", discount: "35% ছাড়", price: "৳39" },
    { name: "Fresh Milk 1L", days: "8 days", discount: "15% ছাড়", price: "৳85" },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#0c261d]/95">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
        <Percent className="h-4 w-4 text-[#f0a36a]" />
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
          Clearance · Expiring soon
        </span>
      </div>
      {items.map((item, i) => (
        <motion.div
          key={item.name}
          initial={{ opacity: 0, x: -14 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 + i * 0.1 }}
          className="grid grid-cols-[1.4fr_0.7fr_0.6fr] items-center gap-2 border-b border-white/8 px-5 py-3.5 last:border-0"
        >
          <div>
            <p className="text-sm font-medium text-white/90">{item.name}</p>
            <p className="text-xs text-[#f0a36a]">{item.days}</p>
          </div>
          <p className="text-xs font-semibold text-[#5ee0b0]">{item.discount}</p>
          <p className="text-right text-sm text-white/70">{item.price}</p>
        </motion.div>
      ))}
    </div>
  );
}

function StockBoard() {
  const stockPreview = [
    { sku: "PRAN Drink 250ml", hub: "Motijheel", onHand: 1280, reserved: 40, status: "Healthy" },
    { sku: "Fresh Atta 2kg", hub: "Uttara", onHand: 86, reserved: 22, status: "Low" },
    { sku: "ACI Salt 1kg", hub: "Chattogram", onHand: 410, reserved: 18, status: "Healthy" },
    { sku: "Radhuni Masala", hub: "Sylhet", onHand: 54, reserved: 30, status: "Watch" },
  ];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#0c261d]/90 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <div className="landing-scan-line pointer-events-none absolute inset-x-0 h-24 bg-linear-to-b from-transparent via-[#5ee0b0]/15 to-transparent" />
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="landing-live-dot relative h-2 w-2 rounded-full bg-[#5ee0b0]" />
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
            Live stock board
          </p>
        </div>
        <p className="text-xs text-white/45">Asia/Dhaka · BDT</p>
      </div>
      <div className="divide-y divide-white/8">
        {stockPreview.map((row, i) => (
          <motion.div
            key={row.sku}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.45 }}
            className="grid grid-cols-[1.4fr_0.8fr_0.55fr_0.55fr] gap-2 px-4 py-3 text-sm sm:px-5"
          >
            <div>
              <p className="font-medium text-white/90">{row.sku}</p>
              <p className="mt-0.5 text-xs text-white/40">{row.hub}</p>
            </div>
            <p className="self-center text-white/70">{row.onHand}</p>
            <p className="self-center text-white/50">{row.reserved}</p>
            <p
              className={`self-center text-right text-xs font-semibold ${
                row.status === "Low"
                  ? "text-[#f0a36a]"
                  : row.status === "Watch"
                    ? "text-[#e6d27a]"
                    : "text-[#5ee0b0]"
              }`}
            >
              {row.status}
            </p>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-4 border-t border-white/10 text-center text-[11px] uppercase tracking-[0.14em] text-white/35">
        <div className="border-r border-white/10 py-2.5">SKU</div>
        <div className="border-r border-white/10 py-2.5">On hand</div>
        <div className="border-r border-white/10 py-2.5">Reserved</div>
        <div className="py-2.5">Status</div>
      </div>
    </div>
  );
}

function MagneticLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18 });
  const springY = useSpring(y, { stiffness: 220, damping: 18 });

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left - rect.width / 2) * 0.18);
        y.set((e.clientY - rect.top - rect.height / 2) * 0.18);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className="inline-flex"
    >
      <Link href={href} className={className}>
        {children}
      </Link>
    </motion.div>
  );
}

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.3]);
  const brandScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07150f] text-white">
      <section ref={heroRef} className="relative isolate min-h-dvh overflow-x-hidden grain mesh-bg">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2400&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-linear-to-r from-[#07150f] via-[#07150f]/78 to-[#07150f]/20" />
          <div className="absolute inset-0 bg-linear-to-t from-[#07150f] via-transparent to-[#07150f]/45" />
        </motion.div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.08, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#0b6e4f]/25 blur-3xl"
          />
          <motion.div
            animate={{ opacity: [0.15, 0.4, 0.15], x: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-0 top-40 h-80 w-80 rounded-full bg-[#5ee0b0]/10 blur-3xl"
          />
        </div>

        <header className="landing-pad relative z-20 flex items-center justify-between py-4">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="flex items-center gap-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0b6e4f] text-sm font-bold">
              ভ
            </span>
            <div>
              <span className="font-display text-xl tracking-tight sm:text-2xl">Bhandar</span>
              <p className="text-[11px] text-white/45">Inventory OS</p>
            </div>
          </motion.div>

          <motion.nav
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="hidden items-center gap-7 text-sm text-white/65 lg:flex"
          >
            <a href="#pillars" className="transition hover:text-white">
              Product
            </a>
            <a href="#modules" className="transition hover:text-white">
              Modules
            </a>
            <a href="#workflow" className="transition hover:text-white">
              How it works
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="flex items-center gap-2"
          >
            <Link
              href="/login"
              className="cursor-pointer rounded-xl px-3.5 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="cursor-pointer rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#07150f] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#e6f4ee] hover:shadow-md"
            >
              Sign up
            </Link>
          </motion.div>
        </header>

        <div className="landing-pad relative z-10 grid min-h-[calc(100dvh-5rem)] grid-cols-1 items-end gap-10 overflow-hidden pb-14 pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:pb-20">
          <div>
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs text-white/70 backdrop-blur-sm"
            >
              <span className="landing-live-dot relative h-1.5 w-1.5 rounded-full bg-[#5ee0b0]" />
              Inventory OS for Bangladesh retail & wholesale
            </motion.div>

            <motion.p
              style={{ scale: brandScale }}
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="origin-left font-display text-[clamp(3.5rem,14vw,9.5rem)] leading-[0.86] tracking-tight text-white"
            >
              Bhandar
            </motion.p>

            <motion.h1
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-5 max-w-xl text-xl font-medium leading-snug text-white/88 sm:text-2xl md:text-3xl"
            >
              Stock, counter, credit & cashbook — one system from Motijheel to Chattogram.
            </motion.h1>

            <motion.p
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-4 max-w-lg text-sm leading-relaxed text-white/58 sm:text-base"
            >
              Multi-warehouse inventory with Counter POS, Hal Khata, purchase & sales
              orders, clearance for perishables, and a shop finance ledger built around
              how Bangladesh businesses actually trade.
            </motion.p>

            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <MagneticLink
                href="/register"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0b6e4f] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0b6e4f]/35 transition hover:-translate-y-0.5 hover:bg-[#085340] hover:shadow-xl hover:shadow-[#0b6e4f]/25"
              >
                Start free
                <ArrowRight className="h-4 w-4" />
              </MagneticLink>
              <Link
                href="/login"
                className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-medium text-white/90 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/10"
              >
                Sign in to dashboard
              </Link>
            </motion.div>

            <motion.div
              custom={5}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/45"
            >
              <span>বিকাশ · নগদ · Cash · উধার</span>
              <span>FEFO batches</span>
              <span>Asia/Dhaka</span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 48, rotate: 1.5 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 1, delay: 0.35, ease }}
            className="hidden lg:block"
          >
            <StockBoard />
          </motion.div>
        </div>
      </section>

      <section className="relative z-30 border-b border-white/10 bg-[#0a1c15]">
        <div className="landing-pad grid grid-cols-2 lg:grid-cols-4">
          {[
            { value: 5, label: "Warehouses across Dhaka, Chattogram & Sylhet", suffix: "" },
            { value: 24, label: "FMCG SKUs with BDT cost & selling prices", suffix: "+" },
            { value: 12, label: "Modules from POS to finance & reports", suffix: "" },
            { value: 4, label: "Pay methods: cash, bKash, Nagad, udhar", suffix: "" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className={`border-white/10 py-8 ${
                i % 2 === 1 ? "border-l pl-4 sm:pl-6" : "pr-4 sm:pr-6"
              } ${i > 1 ? "border-t lg:border-t-0" : ""} ${
                i > 0 ? "lg:border-l lg:pl-6" : "lg:pr-6"
              }`}
            >
              <p className="font-display text-4xl text-[#5ee0b0] sm:text-5xl">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/55">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-30 overflow-hidden border-b border-white/10 bg-[#0b6e4f]">
        <div className="overflow-hidden py-4">
          <div className="landing-marquee flex w-max items-center gap-10 whitespace-nowrap px-4 text-sm font-semibold text-white/90 will-change-transform">
            {[...highlights, ...highlights].map((item, i) => (
              <span key={`${item}-${i}`} className="inline-flex items-center gap-10">
                <span className="tracking-wide">{item}</span>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5ee0b0]" />
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-[#eef2ef] text-[#14201a]">
        <div className="landing-pad grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-24">
          <SectionTitle
            eyebrow="Built for local ops"
            title="The inventory OS that understands BD shop floors."
            subtitle="Not a US-centric ERP clone. Bhandar brings warehouse stock, Counter POS, Hal Khata, clearance, and a taka cashbook into one calm workspace your team can run daily."
          />
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid gap-3 sm:grid-cols-2"
          >
            {[
              {
                icon: Boxes,
                title: "Reserved vs available",
                body: "Sales confirmation locks stock so two counters never sell the same carton twice.",
              },
              {
                icon: ShieldCheck,
                title: "Auditable everything",
                body: "Movements and activity logs keep quantity before/after — for ops and finance.",
              },
              {
                icon: MapPin,
                title: "Bangladesh-ready",
                body: "BDT, Asia/Dhaka, bilingual POS cues, and suppliers that match local distribution.",
              },
              {
                icon: Banknote,
                title: "Every taka tracked",
                body: "Sales income, udhar collections, rent, salary — shop finance beside inventory.",
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={rise}
                whileHover={{ y: -4, borderColor: "rgba(11,110,79,0.35)" }}
                className="rounded-2xl border border-[#d0dad3] bg-white p-6 shadow-sm transition"
              >
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f4ee] text-[#0b6e4f]">
                  <item.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5c6b63]">{item.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="pillars" className="bg-[#f7f9f7] text-[#14201a]">
        <div className="landing-pad space-y-20 py-16 sm:py-24">
          <SectionTitle
            eyebrow="Product pillars"
            title="Three workflows shops open every morning."
            subtitle="Counter sales, neighborhood credit, and perishable clearance — the differentiators generic inventory tools skip."
          />

          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease }}
              className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-14 ${
                index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0b6e4f]">
                  {pillar.eyebrow}
                </p>
                <h3 className="font-display mt-3 text-3xl leading-tight sm:text-4xl">
                  {pillar.title}
                </h3>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-[#5c6b63]">
                  {pillar.body}
                </p>
                <ul className="mt-6 space-y-3">
                  {pillar.points.map((point, i) => (
                    <motion.li
                      key={point}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                      className="flex items-start gap-2.5 text-sm text-[#3d4a43]"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0b6e4f]" />
                      {point}
                    </motion.li>
                  ))}
                </ul>
              </div>
              <div className={index % 2 === 1 ? "landing-float-delayed" : "landing-float"}>
                {pillar.visual === "pos" ? (
                  <PosVisual />
                ) : pillar.visual === "khata" ? (
                  <KhataVisual />
                ) : (
                  <ClearanceVisual />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="modules" className="bg-[#07150f]">
        <div className="landing-pad py-16 sm:py-24">
          <SectionTitle
            light
            eyebrow="Full platform"
            title="Twelve modules. One Inventory OS."
            subtitle="From barcode scan to ABC reports — everything your warehouse, counter, and back office share."
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {modules.map((item) => (
              <motion.div
                key={item.title}
                variants={rise}
                whileHover={{ y: -6, borderColor: "rgba(94,224,176,0.45)" }}
                className="rounded-2xl border border-white/10 bg-white/4 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:bg-white/7"
              >
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b6e4f]/25 text-[#5ee0b0]">
                  <item.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/52">{item.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="workflow" className="bg-white text-[#14201a]">
        <div className="landing-pad py-16 sm:py-24">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <SectionTitle
              eyebrow="How it works"
              title="From catalog to counter to cashbook."
            />
            <p className="max-w-sm text-sm leading-relaxed text-[#5c6b63]">
              Inbound purchase, live stock, retail POS or wholesale fulfillment, then
              finance and replenishment — connected end to end.
            </p>
          </div>

          <div className="relative mt-14">
            <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-[#d8e0d9] xl:block" />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {workflow.map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.55, ease }}
                  whileHover={{ y: -4 }}
                  className="relative rounded-2xl border border-[#e3ebe5] bg-white p-6 shadow-sm transition hover:border-[#0b6e4f]/30 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-3xl text-[#0b6e4f]/30">{item.step}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d0dad3] bg-[#e6f4ee] text-[#0b6e4f]">
                      <item.icon className="h-4 w-4" />
                    </span>
                  </div>
                  <h3 className="mt-8 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#5c6b63]">{item.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0b6e4f]">
        <div className="landing-pad py-16 sm:py-20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                Who it&apos;s for
              </p>
              <h2 className="font-display mt-3 max-w-2xl text-4xl text-white sm:text-5xl">
                Built for the shops and hubs that move Bangladesh commerce.
              </h2>
            </div>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-3 lg:gap-10">
            {audience.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`${
                  i > 0 ? "border-t border-white/20 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0" : ""
                }`}
              >
                <p className="font-display text-2xl text-white sm:text-3xl">{item.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-white/75">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#07150f]">
        <div className="landing-pad py-16 sm:py-24">
          <SectionTitle
            light
            eyebrow="Trusted by teams"
            title="Clearer stock. Quieter evenings."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {testimonials.map((item, i) => (
              <motion.blockquote
                key={item.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.55 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:border-[#5ee0b0]/30 hover:bg-white/8"
              >
                <p className="font-display text-xl leading-snug text-white/90 sm:text-2xl">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <footer className="mt-8">
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-white/50">{item.role}</p>
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-white text-[#14201a]">
        <div className="landing-pad py-16 sm:py-24">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <SectionTitle
              eyebrow="Pricing"
              title="Start free. Scale when ready."
              subtitle="No credit card required. Pick a plan that matches how many warehouses you operate today."
            />
          </div>

          <div className="mt-12 grid gap-3 lg:grid-cols-3">
            {[
              {
                name: "Starter",
                price: "Free",
                detail: "For small teams getting off spreadsheets",
                perks: [
                  "1 warehouse",
                  "Counter POS + Hal Khata",
                  "Purchase & sales orders",
                  "Stock movements",
                ],
              },
              {
                name: "Growth",
                price: "৳2,499",
                detail: "Per month · most popular for distributors",
                perks: [
                  "Up to 5 warehouses",
                  "Clearance & low-stock alerts",
                  "Transfers, finance & reports",
                  "Email support",
                ],
                highlight: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                detail: "For large multi-branch operations",
                perks: [
                  "Unlimited warehouses",
                  "Dedicated onboarding",
                  "SLA & priority support",
                  "Custom integrations",
                ],
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -6 }}
                className={`flex flex-col rounded-2xl border p-7 transition ${
                  plan.highlight
                    ? "border-[#0b6e4f] bg-[#f0faf5] shadow-[0_24px_60px_rgba(11,110,79,0.14)]"
                    : "border-[#d8e0d9] bg-white shadow-sm hover:border-[#0b6e4f]/35 hover:shadow-md"
                }`}
              >
                <p className="text-sm font-semibold text-[#0b6e4f]">{plan.name}</p>
                <p className="font-display mt-2 text-4xl">{plan.price}</p>
                <p className="mt-2 text-sm text-[#5c6b63]">{plan.detail}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm text-[#3d4a43]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0b6e4f]" />
                      {perk}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 inline-flex w-full cursor-pointer items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                    plan.highlight
                      ? "bg-[#0b6e4f] text-white shadow-lg shadow-[#0b6e4f]/25 hover:bg-[#085340]"
                      : "border border-[#d8e0d9] bg-white hover:border-[#0b6e4f] hover:bg-[#f0faf5] hover:text-[#0b6e4f]"
                  }`}
                >
                  Get started
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-[#eef2ef] text-[#14201a]">
        <div className="landing-pad grid gap-10 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:py-24">
          <SectionTitle
            eyebrow="FAQ"
            title="Common questions"
            subtitle="Still unsure? Sign up free or chat with us — we help distributors go live quickly."
          />

          <div className="divide-y divide-[#cfd9d2] border-y border-[#cfd9d2]">
            {faqs.map((item, i) => (
              <motion.details
                key={item.q}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group py-5"
              >
                <summary className="cursor-pointer list-none rounded-xl px-1 py-0.5 font-semibold marker:content-none transition hover:text-[#0b6e4f]">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span className="text-[#0b6e4f] transition duration-300 group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5c6b63]">{item.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#07150f]">
        <motion.div
          animate={{ opacity: [0.2, 0.45, 0.2], scale: [1, 1.15, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#0b6e4f]/35 blur-3xl"
        />
        <motion.div
          animate={{ opacity: [0.12, 0.3, 0.12], x: [0, -20, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-[#5ee0b0]/12 blur-3xl"
        />
        <div className="landing-pad relative flex flex-col items-start justify-between gap-8 py-16 sm:py-20 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-4xl text-white sm:text-5xl lg:text-6xl"
            >
              Ready to run inventory with confidence?
            </motion.h2>
            <p className="mt-4 text-sm text-white/60 sm:text-base">
              Join teams across Bangladesh using Bhandar for stock, POS, Hal Khata, and
              every taka in between.
            </p>
          </div>
          <MagneticLink
            href="/register"
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-7 py-4 text-sm font-semibold text-[#07150f] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#e6f4ee] hover:shadow-xl"
          >
            Create free account
            <ArrowRight className="h-4 w-4" />
          </MagneticLink>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#050f0b]">
        <div className="landing-pad py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0b6e4f] text-sm font-bold">
                  ভ
                </span>
                <div>
                  <span className="font-display text-xl">Bhandar</span>
                  <p className="text-[11px] text-white/40">Inventory OS</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/50">
                Modern inventory management for Bangladesh retailers, wholesalers, and
                multi-branch distributors — with POS, Hal Khata, and shop finance.
              </p>
              <p className="mt-4 text-sm text-white/40">Dhaka, Bangladesh</p>
            </div>

            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <p className="text-sm font-semibold text-white/90">{title}</p>
                <ul className="mt-4 space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-white/45 transition hover:text-white/85"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/35 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} Bhandar. All rights reserved.</p>
            <p>Inventory clarity from Motijheel to Chattogram.</p>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
