import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap, Users, Award, Calendar } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center bg-hero-pattern">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/10 to-transparent rounded-full" />

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          {/* Logo */}
          <div className="flex justify-center mb-8 opacity-0 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <img
                src="/lovable-uploads/fbe5d1f1-a35b-47a7-8c54-80c47f04a9e1.png"
                alt="WEBCAPZ Technologies Logo"
                className="relative h-24 w-auto object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 opacity-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span className="gradient-text">WEBCAPZ</span>
            <br />
            <span className="text-foreground">Technologies</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto opacity-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Empowering education through innovative technology solutions
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/auth">
              <Button size="lg" className="gradient-bg text-primary-foreground px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/verify-certificate">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg font-semibold border-2 hover:bg-secondary transition-all duration-300">
                Verify Certificate
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 px-6 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-4">
            Everything you need to manage education
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            A comprehensive platform for students, staff, and administrators
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: GraduationCap, title: 'Student Portal', desc: 'Access courses, results, and certificates' },
              { icon: Users, title: 'Staff Management', desc: 'Manage instructors and departments' },
              { icon: Award, title: 'Certificates', desc: 'Issue and verify digital certificates' },
              { icon: Calendar, title: 'Scheduling', desc: 'Class schedules and attendance tracking' },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="glass-card rounded-2xl p-6 hover-lift group cursor-default"
              >
                <div className="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/lovable-uploads/fbe5d1f1-a35b-47a7-8c54-80c47f04a9e1.png"
              alt="WEBCAPZ"
              className="h-8 w-auto"
            />
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} WEBCAPZ Technologies. All rights reserved.
            </span>
          </div>
          <Link to="/verify-certificate" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Verify Certificate
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Index;
