"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { User } from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  bio: string;
}

const team: TeamMember[] = [
  {
    name: "Avinash Jain",
    role: "Founder & CEO",
    bio: "Serial foodie and data nerd. Believes the best food discovery comes from algorithms, not influencers.",
  },
  {
    name: "Coming Soon",
    role: "Head of Product",
    bio: "We're looking for someone who obsesses over food UX and thinks restaurant ratings are fundamentally broken.",
  },
  {
    name: "Coming Soon",
    role: "Head of Engineering",
    bio: "We're looking for a builder who wants to scale Elo rankings to every dish in every city in the world.",
  },
];

export function TeamSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <section ref={ref}>
      <motion.div
        className="text-center mb-16"
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-[#FF4D00] mb-4">
          THE TEAM
        </p>
        <h2 className="font-display italic font-black text-3xl md:text-5xl tracking-tighter">
          The People Behind the Fork
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {team.map((member, i) => (
          <motion.div
            key={member.role}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 hover:border-white/20 transition-all"
            animate={
              isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
          >
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <User size={32} className="text-white/20" />
            </div>
            <h3 className="text-base font-black text-white">{member.name}</h3>
            <p className="text-xs font-bold text-[#FF4D00] uppercase tracking-wider mt-1">
              {member.role}
            </p>
            <p className="text-sm text-white/40 leading-relaxed mt-3">
              {member.bio}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
