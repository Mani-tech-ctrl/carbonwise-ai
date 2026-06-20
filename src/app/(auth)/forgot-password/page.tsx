/* eslint-disable react/no-unescaped-entities, @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Leaf, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Screen 1: Fetch security question for email
  const handleFetchQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to retrieve security question.');
      } else {
        setSecurityQuestion(data.securityQuestion);
        setStep(2);
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Screen 2: Verify answer hash
  const handleVerifyAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!securityAnswer.trim()) {
      setError('Please provide your security answer.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/verify-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, answer: securityAnswer }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Incorrect security answer.');
      } else {
        setStep(3);
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Screen 3: Submit reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          answer: securityAnswer, 
          newPassword 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Password reset failed.');
      } else {
        setStep(4);
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-blue-600 mb-6">
          <Leaf className="w-12 h-12" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-2">Recover Account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-0 shadow-xl shadow-slate-900/5">
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Account Recovery'}
              {step === 2 && 'Security Challenge'}
              {step === 3 && 'Reset Password'}
              {step === 4 && 'Recovery Successful'}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Enter your registered email address to find your account."}
              {step === 2 && "Answer the security question chosen during your registration."}
              {step === 3 && "Provide a new password for your CarbonWise account."}
              {step === 4 && "Your password has been reset successfully."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <form onSubmit={handleFetchQuestion} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {error && <div className="text-red-600 text-sm font-medium">{error}</div>}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyAnswer} className="space-y-6">
                <div>
                  <span className="block text-xs font-semibold text-blue-600 uppercase tracking-wide">Question</span>
                  <p className="mt-1 text-base font-bold text-gray-950 bg-slate-50 border border-slate-150 rounded-xl p-3.5">
                    {securityQuestion}
                  </p>
                </div>

                <div>
                  <label htmlFor="securityAnswer" className="block text-sm font-medium text-gray-700">
                    Security Answer
                  </label>
                  <div className="mt-1">
                    <Input
                      id="securityAnswer"
                      name="securityAnswer"
                      type="text"
                      required
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      className="w-full border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                      placeholder="Your answer"
                    />
                  </div>
                </div>

                {error && <div className="text-red-600 text-sm font-medium">{error}</div>}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-sm font-medium"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Answer'}
                  </Button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border-gray-300 focus:border-blue-600 focus:ring-blue-600 pr-10"
                      placeholder="********"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border-gray-300 focus:border-blue-600 focus:ring-blue-600 pr-10"
                      placeholder="********"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {error && <div className="text-red-600 text-sm font-medium">{error}</div>}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={loading}
                    className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-sm font-medium"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                  </Button>
                </div>
              </form>
            )}

            {step === 4 && (
              <div className="space-y-6 text-center">
                <p className="text-green-600 font-medium">Password updated successfully. Please login.</p>
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-sm text-sm font-medium"
                >
                  Go to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {step === 1 && (
          <p className="mt-6 text-center text-sm text-gray-600">
            Remembered your account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-600">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
