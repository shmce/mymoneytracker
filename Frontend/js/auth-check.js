/**
 * Client-side authentication check
 * This script checks if the user is authenticated by making a request to the backend
 * If not authenticated, redirects to login page
 */
(function() {
    'use strict';
    
    // Check authentication status
    async function checkAuth() {
        try {
            const response = await fetch('../../Backend/getProfile.php', {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store'
            });
            
            if (!response.ok || response.status === 401) {
                // User is not authenticated, redirect to login
                // Log error details for debugging
                try {
                    const data = await response.json();
                    if (data && data.error) {
                        console.warn('Auth check failed:', data.error);
                    }
                } catch (e) {
                    // Response is not JSON, that's okay
                }
                window.location.replace('../loginPage/Login.html');
                return false;
            }
            
            // Verify response is valid JSON
            try {
                await response.json();
            } catch (e) {
                console.warn('Auth check: Invalid response format');
                // Still consider it authenticated if status is OK
            }
            
            return true;
        } catch (error) {
            console.error('Auth check failed:', error);
            // On network error or other exception, redirect to login to be safe
            window.location.replace('../loginPage/Login.html');
            return false;
        }
    }
    
    // Run check when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAuth);
    } else {
        checkAuth();
    }
    
    // Also check on pageshow event (handles back/forward button)
    window.addEventListener('pageshow', function(event) {
        // If page was loaded from cache (back button), check auth again
        if (event.persisted) {
            checkAuth();
        }
    });
})();

