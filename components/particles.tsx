"use client";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { useEffect, useMemo, useState } from "react";
import { loadSlim } from "@tsparticles/slim";
import { useTheme } from "next-themes";
import { useBackground } from "@/lib/background-provider";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";

const ParticlesComponent = ({ className }: { className: string }) => {
    const { resolvedTheme } = useTheme();
    const [, setInit] = useState(false);
    const { background } = useBackground();
    
    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const options = useMemo(
        () => ({
            background: {
                color: {
                    value: resolvedTheme === "dark" ? "#000000" : "#FFFFFF",
                },
            },
            fpsLimit: 120,
            interactivity: {
                events: {
                    onClick: {
                        enable: true,
                        mode: "repulse",
                    },
                    onHover: {
                        enable: true,
                        mode: 'grab',
                    },
                },
                modes: {
                    repulse: {
                        distance: 200,
                        duration: 0.5,
                    },
                    grab: {
                        distance: 150,
                        line_linked: {
                            opacity: 20
                        }
                    },
                },
            },
            particles: {
                color: {
                    value: resolvedTheme === "dark" ? "#FFFFFF" : "#000000",
                },
                links: {
                    color: resolvedTheme === "dark" ? "#FFFFFF" : "#000000",
                    enable: false,
                },
                move: {
                    direction: "none" as const,
                    enable: true,
                    outModes: {
                        default: "bounce" as const,
                    },
                    random: true,
                    speed: 1,
                    straight: false,
                },
                number: {
                    density: {
                        enable: true,
                    },
                    value: 150,
                },
                opacity: {
                    value: 1.0,
                },
                shape: {
                    type: "circle",
                },
                size: {
                    value: { min: 1, max: 3 },
                },
            },
            detectRetina: true,
        }),
        [resolvedTheme],
    );

    return <>
    <AnimatePresence>
        {background === "particles" ? 
        <motion.div key="particles"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "spring", duration: 2 }}
            exit={{ opacity: 0 }}
        >
            <Particles className={className} options={options} />
        </motion.div> : <div className={cn(className, resolvedTheme === "dark" ? "bg-black" : "bg-white")}></div>}
    </AnimatePresence>
    </>
};

export default ParticlesComponent;