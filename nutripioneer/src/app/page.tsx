
import Link from 'next/link';
import { searchPhotos } from '@/lib/unsplash';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import * as motion from 'motion/react-client';
import styles from './page.module.css';

export default async function Page() {
  // Fetch a background image from Unsplash
  const photos = await searchPhotos('food', 10);
  const bgImage = photos.length > 0 ? photos[Math.floor(Math.random() * photos.length)].url : '/fallback-bg.jpg';

  // Feature list
  const features = [
    {
      icon: <CheckCircle2 className={`${styles.iconGreen} w-6 h-6`} />,
      title: "Personalized Nutrition",
      description: "AI-driven meal plans tailored to your specific health goals and dietary needs."
    },
    {
      icon: <ShieldCheck className={`${styles.iconBlue} w-6 h-6`} />,
      title: "Drug-Nutrient Safety",
      description: "Advanced safety checks to prevent adverse interactions between your medications and food."
    },
    {
      icon: <Zap className={`${styles.iconYellow} w-6 h-6`} />,
      title: "Smart Grocery Lists",
      description: "Automatically generate shopping lists from your meal plans to save time and reduce waste."
    }
  ];

  return (
    <div className={styles.container}>

      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          NutriPioneer
        </div>
        <div className={styles.navLinks}>
          <Link href="/onboarding" className={styles.navLink}>
            Login
          </Link>
          <Link href="/onboarding" className={styles.navButton}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        {/* Background Image / Overlay */}
        <div className={styles.heroBg}>
          {bgImage && (
            <img
              src={bgImage}
              alt="Background"
              className={styles.bgImage}
            />
          )}
          <div className={styles.overlay} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={styles.heroContent}
        >
          <h1 className={styles.headline}>
            Eat Smarter.<br />
            <span className={styles.gradientText}>
              Live Healthier.
            </span>
          </h1>
          <p className={styles.subtext}>
            The intelligent nutrition platform that adapts to your biology.
            Plan meals, track macro-nutrients, and ensure medication safety in one sleek interface.
          </p>

          <div className={styles.ctaGroup}>
            <Link href="/home" className={styles.primaryBtn}>
              Start Your Journey
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#features" className={styles.secondaryBtn}>
              Learn More
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.featuresWrapper}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className={styles.sectionHeader}
          >
            <h2 className={styles.sectionTitle}>Why NutriPioneer?</h2>
            <p className={styles.sectionSubtitle}>Advanced technology meets holistic wellness.</p>
          </motion.div>

          <div className={styles.featuresGrid}>
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.2 }}
                className={styles.featureCard}
              >
                <div className={styles.iconWrapper}>
                  {feature.icon}
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} NutriPioneer. All rights reserved.</p>
      </footer>
    </div>
  );
}
