import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, Gift, Calendar, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface InvestorPasswordGateProps {
  onAuthenticated: () => void;
}

const INVESTOR_PASSWORD = "Elyphant_2026!";

const InvestorPasswordGate: React.FC<InvestorPasswordGateProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    firm: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === INVESTOR_PASSWORD) {
      onAuthenticated();
    } else {
      setError('Invalid password. Please contact invest@elyphant.com for access.');
      setPassword('');
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate submission - in production, this would send to an edge function
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Inquiry sent successfully!', {
      description: 'We\'ll be in touch within 24 hours.'
    });
    
    setInquiryForm({ name: '', email: '', firm: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(56, 189, 248, 0.3) 0%, transparent 50%)`
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <motion.div 
            className="flex items-center justify-center gap-3 mb-4"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Gift className="w-10 h-10 text-sky-400" />
            <span className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-sky-400 bg-clip-text text-transparent">
              Elyphant
            </span>
          </motion.div>
          <p className="text-gray-400 text-lg">Investor Relations</p>
        </div>

        {/* Main Card */}
        <motion.div
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {!showInquiryForm ? (
            <>
              {/* Password Form */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-sky-500/20 flex items-center justify-center border border-purple-500/30">
                  <Lock className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Pitch Deck Access</h1>
                <p className="text-gray-400 text-sm">
                  Enter your access code to view our investor presentation
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password" className="text-gray-300">Access Code</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter access code"
                    className="mt-1 bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
                  />
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm mt-2"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white font-semibold py-3 transition-all duration-300"
                >
                  Access Pitch Deck
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-gray-800/50 text-gray-500">or</span>
                </div>
              </div>

              {/* Inquiry Option */}
              <Button
                variant="outline"
                onClick={() => setShowInquiryForm(true)}
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                Request Access / Inquire
              </Button>
            </>
          ) : (
            <>
              {/* Inquiry Form */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-sky-500/20 flex items-center justify-center border border-purple-500/30">
                  <Mail className="w-8 h-8 text-sky-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Investor Inquiry</h1>
                <p className="text-gray-400 text-sm">
                  Get in touch with our investor relations team
                </p>
              </div>

              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={inquiryForm.name}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your name"
                    required
                    className="mt-1 bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inquiryForm.email}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="you@firm.com"
                    required
                    className="mt-1 bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <Label htmlFor="firm" className="text-gray-300">Firm / Organization</Label>
                  <Input
                    id="firm"
                    type="text"
                    value={inquiryForm.firm}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, firm: e.target.value }))}
                    placeholder="Your firm name"
                    className="mt-1 bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-gray-300">Message</Label>
                  <Textarea
                    id="message"
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Tell us about your interest in Elyphant..."
                    rows={3}
                    className="mt-1 bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-purple-500 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white font-semibold py-3 transition-all duration-300"
                >
                  {isSubmitting ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Inquiry
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowInquiryForm(false)}
                  className="w-full text-gray-400 hover:text-white hover:bg-gray-700/30"
                >
                  Back to Password Entry
                </Button>
              </form>
            </>
          )}
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center space-y-3"
        >
          <a
            href="mailto:invest@elyphant.com"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-purple-400 transition-colors"
          >
            <Mail className="w-4 h-4" />
            invest@elyphant.com
          </a>
          
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <Calendar className="w-4 h-4" />
            <a
              href="https://calendly.com/elyphant"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-400 transition-colors"
            >
              Schedule a Call
            </a>
          </div>

          <p className="text-gray-600 text-xs mt-4">
            © 2026 Elyphant Inc. All rights reserved.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default InvestorPasswordGate;
