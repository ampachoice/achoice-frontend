import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export default function ProtectedRoute({
    children,
    adminOnly = false,
    allowedRoles = null
}) {

    const [expired, setExpired] = useState(false);

    const token = localStorage.getItem("token");

    const user = JSON.parse(
        localStorage.getItem("user")
    );

    useEffect(() => {

        // If user isn't logged in, don't start timer
        if (!token || !user) return;

        const updateActivity = () => {

            localStorage.setItem(
                "last_activity",
                Date.now()
            );

        };

        // Save current activity immediately
        updateActivity();

        const events = [

            "mousemove",
            "mousedown",
            "click",
            "keydown",
            "keypress",
            "scroll",
            "touchstart"

        ];

        events.forEach(event =>
            window.addEventListener(
                event,
                updateActivity
            )
        );

        const timer = setInterval(() => {

            const lastActivity = Number(
                localStorage.getItem("last_activity")
            );

            if (!lastActivity) return;

            const idleTime =
                Date.now() - lastActivity;

            if (idleTime >= IDLE_TIMEOUT) {

                clearInterval(timer);

                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("last_activity");

                alert(
                    "Your session expired after 5 minutes of inactivity."
                );

                setExpired(true);

            }

        }, 1000);

        return () => {

            clearInterval(timer);

            events.forEach(event =>
                window.removeEventListener(
                    event,
                    updateActivity
                )
            );

        };

    }, [token]);

    // ======================
    // LOGIN CHECK
    // ======================

    if (expired) {

        return <Navigate to="/login" replace />;

    }

    if (!token || !user) {

        return <Navigate to="/login" replace />;

    }

    // ======================
    // ADMIN CHECK
    // ======================

    if (
        adminOnly &&
        user.role !== "admin"
    ) {

        return <Navigate to="/" replace />;

    }

    // ======================
    // ROLE CHECK
    // ======================

    if (
        allowedRoles &&
        !allowedRoles.includes(user.role)
    ) {

        return <Navigate to="/" replace />;

    }

    return children;

}