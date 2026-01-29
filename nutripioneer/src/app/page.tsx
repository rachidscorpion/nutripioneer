
import Link from 'next/link';
import { searchPhotos } from '@/lib/unsplash';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Activity,
  ChefHat,
  ScanLine,
  Globe,
  Search,
  Database
} from 'lucide-react';
import * as motion from 'motion/react-client';
import styles from './page.module.css';

export default async function Page() {
  // Fetch a background image from Unsplash
  const photos = await searchPhotos('healthy food', 10);
  const bgImage = photos.length > 0 ? photos[Math.floor(Math.random() * photos.length)].url : '/fallback-bg.jpg';

  // Feature list
  const features = [
    {
      icon: <Activity className="w-8 h-8" />,
      title: "Medical Intelligence",
      description: "Support for 55,000+ conditions including CKD, Diabetes, and PCOS via direct ICD-11 integration."
    },
    {
      icon: <ShieldCheck className="w-8 h-8" />,
      title: "Drug-Nutrient Safety",
      description: "Real-time safety checks against your medications to prevent adverse interactions."
    },
    {
      icon: <ChefHat className="w-8 h-8" />,
      title: "Personalized Menus",
      description: "AI-generated recipes that respect your taste buds and your doctor's orders."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Smart Grocery",
      description: "Auto-generated shopping lists sorted by aisle to save you time and reduce waste."
    },
    {
      icon: <ScanLine className="w-8 h-8" />,
      title: "Restaurant Rescue",
      description: "Scan any menu to find the safest options for your specific condition instantly."
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Universal Access",
      description: "Just-in-Time onboarding means we support any rare condition you may have."
    }
  ];

  const workflowSteps = [
    { title: "Create Profile", description: "Enter your biometrics and goals." },
    { title: "Add Conditions", description: "Search any medical condition from WHO's ICD-11." },
    { title: "Log Meds", description: "List your medications for safety checks." },
    { title: "Set Preferences", description: "Tell us what you love to eat." },
    { title: "Get Your Plan", description: "Receive your tailored meal plan instantly." }
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
            <Link href="/onboarding" className={styles.primaryBtn}>
              Start Your Journey
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#features" className={styles.secondaryBtn}>
              Learn More
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Trust / Science Section */}
      <section className={styles.trustSection}>
        <p className={styles.sectionSubtitle}>Powered by trusted data sources</p>
        <div className={styles.trustGrid}>
          <div className={styles.trustItem}>WHO ICD-11</div>
          <div className={styles.trustItem}>USDA FoodData</div>
          <div className={styles.trustItem}>FatSecret API</div>
          <div className={styles.trustItem}>OpenAI GPT-4</div>
        </div>
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
            <p className={styles.sectionSubtitle}>Advanced technology meets holistic wellness. We handle the complexity of your health so you can focus on enjoying your food.</p>
          </motion.div>

          <div className={styles.featuresGrid}>
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
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

      {/* How It Works Section */}
      <section className={styles.howItWorksSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <p className={styles.sectionSubtitle}>From profile to plate in five simple steps.</p>
        </div>

        <div className={styles.timeline}>
          <div className={styles.timelineLine} />
          {workflowSteps.map((step, idx) => (
            <motion.div
              key={idx}
              className={styles.timelineItem}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
            >
              <div className={styles.timelineMarker} />
              <div className={styles.timelineContent}>
                <h3 className={styles.featureTitle}>{idx + 1}. {step.title}</h3>
                <p className={styles.featureDescription}>{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <motion.div
          className={styles.ctaCard}
          initial={{ scale: 0.95, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className={styles.ctaTitle}>Ready to take control?</h2>
          <p className={styles.subtext} style={{ marginBottom: '2rem' }}>
            Join thousands of users who have transformed their health management with NutriPioneer.
          </p>
          <Link href="/onboarding" className={styles.primaryBtn} style={{ display: 'inline-flex' }}>
            Get Started Now
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} NutriPioneer. All rights reserved.</p>
      </footer>
    </div>
  );
}
