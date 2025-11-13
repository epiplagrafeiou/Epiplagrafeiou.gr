
'use server';

import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { firestore } from "@/firebase/server-init"; // Assuming you have a server-side init

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    points: number;
}

export async function addPointsToUser(userId: string, pointsToAdd: number) {
    if (!userId || !pointsToAdd) {
        throw new Error("User ID and points to add are required.");
    }

    const userRef = doc(firestore, "users", userId);

    try {
        await updateDoc(userRef, {
            points: increment(pointsToAdd)
        });
        console.log(`Successfully added ${pointsToAdd} points to user ${userId}`);
        return { success: true };
    } catch (error) {
        console.error("Error adding points:", error);
        // In a real app, you might want to check if the document exists first
        // and create it if it doesn't, or handle the error more gracefully.
        return { success: false, error: "Failed to update points." };
    }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;
    
    const userRef = doc(firestore, "users", userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    } else {
        return null;
    }
}
