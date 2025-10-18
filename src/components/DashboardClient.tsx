'use client';

/**
 * Dashboard Client Component - Interactive dashboard with class management
 * 
 * FEATURES:
 * - Displays available classes in a responsive grid
 * - Shows user's enrolled classes
 * - Handles enrollment/unenrollment actions
 * - Real-time loading states and error handling
 * - Modern, accessible design with Tailwind CSS
 */

import { useState, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { Session } from 'next-auth';

interface Class {
  id: string;
  name: string;
  instructor: string;
  description: string;
  capacity: number;
  currentEnrollment: number;
  schedule: string;
  semester: string;
  credits: number;
  prerequisites: string;
  location: string;
}

interface Enrollment {
  id: string;
  email: string;
  className: string;
  classId: string;
  enrolledAt: string;
  status: 'active' | 'dropped';
}

interface DashboardClientProps {
  session: Session;
}

export function DashboardClient({ session }: DashboardClientProps) {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [enrollingClassId, setEnrollingClassId] = useState<string | null>(null);
  const [unenrolling, setUnenrolling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch available classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch('/api/classes');
        const data = await response.json();
        
        if (response.ok && data.success) {
          setClasses(data.data.classes);
        } else {
          setError('Failed to load classes');
        }
      } catch (error) {
        setError('Failed to load classes');
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

  // Fetch user enrollments
  const fetchEnrollments = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadingEnrollments(true);
    
    try {
      const response = await fetch('/api/enrollments');
      
      if (response.status === 401) {
        // Session expired, redirect to login
        router.push('/login');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        
        // DEBUG: Log the response data
        console.log('Frontend: Response status:', response.status);
        console.log('Frontend: Response data:', JSON.stringify(data, null, 2));
        console.log('Frontend: Data is array:', Array.isArray(data));
        
        // Handle array directly
        const enrollments = Array.isArray(data) ? data : [];
        console.log('Frontend: Setting enrollments array with length:', enrollments.length);
        setEnrollments(enrollments);
      } else {
        const errorData = await response.json();
        console.log('Frontend: API error:', errorData.error);
        setError('Failed to load enrollments');
      }
    } catch (error) {
      console.error('Frontend: Fetch error:', error);
      setError('Failed to load enrollments');
      setEnrollments([]); // Set empty array on error
    } finally {
      if (showLoading) setLoadingEnrollments(false);
    }
  }, [router]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  // Handle class enrollment
  const handleEnroll = async (classId: string) => {
    setEnrollingClassId(classId);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId,
          action: 'enroll',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage(`Successfully enrolled in ${data.data.className}!`);
        
        // Refresh enrollments
        await fetchEnrollments(false);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        setError(data.error || 'Enrollment failed');
      }
    } catch (error) {
      setError('Enrollment failed. Please try again.');
    } finally {
      setEnrollingClassId(null);
    }
  };

  // Handle class unenrollment
  const handleUnenroll = async (className: string) => {
    if (!confirm(`Are you sure you want to unenroll from ${className}?`)) {
      return;
    }

    setUnenrolling(className);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/enrollments', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          className,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage(`Successfully unenrolled from ${className}!`);
        
        // Refresh enrollments
        await fetchEnrollments(false);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        setError(data.error || 'Unenrollment failed');
      }
    } catch (error) {
      setError('Unenrollment failed. Please try again.');
    } finally {
      setUnenrolling(null);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Check if user is enrolled in a class
  const isEnrolledInClass = (classId: string) => {
    return enrollments.some(enrollment => 
      enrollment.classId === classId && enrollment.status === 'active'
    );
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SR</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {session.user.name}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg" role="alert">
            <p className="text-green-700 font-medium">{successMessage}</p>
          </div>
        )}

        {/* My Enrolled Classes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Enrolled Classes</h2>
          
          {loadingEnrollments ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : enrollments.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 text-center border border-white/30">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classes Enrolled</h3>
              <p className="text-gray-600">You haven't enrolled in any classes yet. Browse available classes below to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:gap-6">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {enrollment.className}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Enrolled on {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        Enrolled
                      </span>
                      <button
                        onClick={() => handleUnenroll(enrollment.className)}
                        disabled={unenrolling === enrollment.className}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          unenrolling === enrollment.className
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow-md'
                        }`}
                      >
                        {unenrolling === enrollment.className ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
                            <span>Unenrolling...</span>
                          </div>
                        ) : (
                          'Unenroll'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Available Classes */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Classes</h2>
          
          {loadingClasses ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((classItem) => {
                const isEnrolled = isEnrolledInClass(classItem.id);
                const isEnrolling = enrollingClassId === classItem.id;
                const isFull = classItem.currentEnrollment >= classItem.capacity;

                return (
                  <div
                    key={classItem.id}
                    className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                  >
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {classItem.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {classItem.description}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {classItem.instructor}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {classItem.schedule}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {classItem.location}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {classItem.currentEnrollment}/{classItem.capacity} enrolled
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{classItem.credits} credits</span>
                      </div>
                      
                      <button
                        onClick={() => handleEnroll(classItem.id)}
                        disabled={isEnrolled || isEnrolling || isFull}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          isEnrolled
                            ? 'bg-green-100 text-green-800 cursor-not-allowed'
                            : isFull
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : isEnrolling
                            ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                        }`}
                      >
                        {isEnrolling ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                            <span>Enrolling...</span>
                          </div>
                        ) : isEnrolled ? (
                          'Enrolled'
                        ) : isFull ? (
                          'Full'
                        ) : (
                          'Enroll'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}