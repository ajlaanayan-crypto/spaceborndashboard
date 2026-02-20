import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
    try {
        const { message, userId, userName } = await request.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Valid message string is required.' }, { status: 400 });
        }

        // Limit length tightly on the backend as well
        const trimmedMessage = message.trim().slice(0, 200);

        // --- 1. HYBRID FAQ LOGIC ---
        const lowerMsg = trimmedMessage.toLowerCase();

        const faqResponses = [
            // Greetings & Small Talk
            {
                keywords: ['hello', 'hi', 'hey', 'greetings', 'morning', 'afternoon', 'sup'],
                reply: "Hello there! I'm ANSA, your digital assistant for the SPACE BORN dashboard. I'm here to help interns and employees navigate the platform. How can I assist you today?"
            },
            {
                keywords: ['who are you', 'your name', 'what are you', 'ansa'],
                reply: "I am ANSA (Automated Navigation and System Assistant). I'm engineered to help you navigate this dashboard, track your performance, and find your assigned tasks efficiently."
            },
            // Navigation & Layout
            {
                keywords: ['dashboard', 'where is', 'navigate', 'find', 'sidebar', 'menu'],
                reply: "Your navigation is localized on the left Sidebar (or under the Menu icon on Mobile). From there, you can access 'My Tasks', 'Team Chat', 'Resources', and 'Performance'."
            },
            // Tasks & Work
            {
                keywords: ['task', 'assignment', 'todo', 'work', 'project'],
                reply: "You can view all the tasks currently assigned to you in the 'My Tasks' section. There, you can update their status (like in-progress or completed) so your managers can track your work."
            },
            // Communication
            {
                keywords: ['chat', 'message', 'team', 'communicate', 'talk', 'broadcast'],
                reply: "Use the 'Team Chat' tab for real-time messaging. You can communicate instantly with your immediate peers and team leaders in your assigned Group."
            },
            // Resources & Hub
            {
                keywords: ['resource', 'document', 'pdf', 'video', 'hub', 'link', 'youtube', 'file', 'learn', 'training'],
                reply: "The Resources Hub stores all crucial documents, links, and training videos you need as an intern or employee. Search by tags or categories to find what you need to learn."
            },
            // Meetings & Scheduling
            {
                keywords: ['meeting', 'call', 'schedule', 'zoom', 'calendar', 'google meet'],
                reply: "Check out the 'Meetings' or 'Calendar' tabs. Keep an eye on those pages for your upcoming syncs, which are scheduled by your team leaders and administrators."
            },
            // Groups & Organization
            {
                keywords: ['group', 'switch', 'department', 'team', 'organization'],
                reply: "Your workspace is tied to your Group. If you belong to multiple groups or departments as part of your rotation, use the Group Switcher dropdown at the top of your sidebar to hop between them."
            },
            // Performance & Tracking (Intern Focus)
            {
                keywords: ['performance', 'track', 'review', 'rating', 'feedback', 'how am i doing'],
                reply: "You have a dedicated 'Performance' tracking view where management grades your development, tasks, and core metrics. Check there for your ongoing evaluations!"
            },
            // Auth & Account
            {
                keywords: ['password', 'reset', 'login', 'account', 'sign out', 'logout'],
                reply: "If you need a password reset, reach out to your Administrator. To sign out of your own account, click the 'Sign Out' button at the bottom of the sidebar."
            },
            // Profile Setup
            {
                keywords: ['profile', 'avatar', 'picture', 'update name'],
                reply: "You can update your personal details and avatar by navigating to the 'Profile' section at the bottom of your sidebar."
            },
            // Finance (Hard blocked for interns)
            {
                keywords: ['finance', 'money', 'budget', 'expense', 'investor', 'asset', 'salary'],
                reply: "I am only programmed to assist with Intern and Employee daily operations. For queries regarding finance, payroll, or budgeting, please speak to your direct manager or HR."
            },
            // DeepSeek/AI Info
            {
                keywords: ['ai', 'deepseek', 'model', 'api', 'intelligence', 'gemini'],
                reply: "I am equipped with a hybrid intelligence model. For complex queries about your role, I securely route your question to the cutting-edge gemini engine. Everything else is handled locally at zero latency!"
            },
            // Limit/Rate error inquiry
            {
                keywords: ['limit', 'error', 'slow', 'wait', 'character', 'too long'],
                reply: "To keep our system efficient, messages are capped at 200 characters and you are allowed one message every 3 seconds. Please keep your queries concise!"
            },
            // Company Info
            {
                keywords: ['space born', 'spaceborn', 'company'],
                reply: "SPACE BORN is an elite corporate ecosystem designed for fluid management of teams. As an intern here, you will be collaborating with core employees to push our infrastructure forward."
            }
        ];

        // Check for FAQ Match (Only if the user isn't asking explicitly about their own data context)
        const isContextQuery = lowerMsg.includes('my task') || lowerMsg.includes('my meeting') || lowerMsg.includes('what do i have') || lowerMsg.includes('my schedule');

        if (!isContextQuery) {
            for (const faq of faqResponses) {
                if (faq.keywords.some(kw => lowerMsg.includes(kw))) {
                    // Return quick FAQ response to save API costs
                    return NextResponse.json({ reply: faq.reply });
                }
            }
        }

        // --- 2. GOOGLE GEMINI API FALLBACK (FREE TIER) ---

        let dynamicContext = "";

        if (userId && adminDb) {
            try {
                // Fetch user's latest active tasks
                const tasksSnapshot = await adminDb.collection("tasks")
                    .where("assignedTo", "==", userId)
                    .where("status", "in", ["pending", "in_progress"])
                    .orderBy("createdAt", "desc")
                    .limit(5)
                    .get();

                const tasks = tasksSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return `- ${data.title} (Status: ${data.status})`;
                });

                // Fetch meetings where user is a participant
                const partsSnapshot = await adminDb.collection("meetingParticipants")
                    .where("userId", "==", userId)
                    .limit(5)
                    .get();

                const meetingIds = partsSnapshot.docs.map(doc => doc.data().meetingId);
                const meetings: string[] = [];

                if (meetingIds.length > 0) {
                    // Fetch the actual meetings
                    const meetQuery = await adminDb.collection("meetings")
                        .where("__name__", "in", meetingIds)
                        .where("status", "==", "scheduled")
                        .get();

                    meetQuery.docs.forEach(doc => {
                        const data = doc.data();
                        meetings.push(`- ${data.title}`);
                    });
                }

                dynamicContext = `
--- REAL-TIME USER CONTEXT ---
The user you are speaking to is named: ${userName || 'Employee'}.
They currently have the following active tasks assigned to them:
${tasks.length > 0 ? tasks.join('\n') : "No active tasks at the moment."}

They have the following upcoming scheduled meetings:
${meetings.length > 0 ? meetings.join('\n') : "No upcoming meetings scheduled."}
------------------------------
Reflect on this context if the user asks about their workload or schedule.
`;
            } catch (error) {
                console.error("Error fetching context for Gemini:", error);
            }
        }

        const baseSystemPrompt = `You are ANSA (Automated Navigation and System Assistant), the helpful AI chatbot for the SPACE BORN corporate dashboard. 
Your strict directive is to ONLY assist and respond from the perspective of helping an INTERN or entry-level employee. 
You are NOT to explain, guide, or offer Administrator features (such as Finance, Budgets, Creating Users, Group Management, or Broadcasting). 
If the user asks about restricted management tasks, politely state that you only assist with Intern-level tools like:
- Viewing 'My Tasks'
- Checking the 'Performance' evaluations tab
- Reading the 'Resources Hub'
- Sending messages in 'Team Chat'
- Checking 'Meetings' on the calendar

Keep your answers concise, professional, friendly, and directly helpful. Do not use more than 3-4 sentences. Do not hallucinate features.`;

        const systemPrompt = baseSystemPrompt + "\n" + dynamicContext;

        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!geminiApiKey) {
            return NextResponse.json({ reply: "I'm sorry, my AI connection is currently unconfigured. Please ask an administrator to add the Gemini API key." });
        }

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [{
                    parts: [{ text: trimmedMessage }]
                }],
                generationConfig: {
                    maxOutputTokens: 800,
                    temperature: 0.7
                }
            })
        });

        if (!geminiResponse.ok) {
            console.warn("Gemini API Error:", await geminiResponse.text());
            throw new Error("Gemini API responded with an error.");
        }

        const data = await geminiResponse.json();
        const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response for that.";

        return NextResponse.json({ reply: botReply });

    } catch (error: any) {
        console.error("ANSA Chat API Error:", error);
        return NextResponse.json({ error: 'Failed to process chat message.' }, { status: 500 });
    }
}
