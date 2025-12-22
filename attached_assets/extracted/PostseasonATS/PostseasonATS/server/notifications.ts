import { User, Game } from "@shared/schema";

// Email notification service
// This uses environment-based email configuration
// Set up email integration (Resend, SendGrid, etc.) to enable notifications

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Check if email service is configured
  const emailEnabled = process.env.EMAIL_ENABLED === "true";
  
  if (!emailEnabled) {
    console.log("[Email] Service not configured - email not sent:", options.subject);
    return false;
  }

  try {
    // Email provider integration required
    // To enable email notifications:
    // 1. Set up an email integration (Resend, SendGrid, etc.) using the Replit integrations panel
    // 2. Install the provider's SDK (e.g., npm install resend)
    // 3. Implement the sendEmail logic here using the provider's API
    // 4. Set EMAIL_ENABLED=true in your environment variables
    //
    // Example for Resend:
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: process.env.EMAIL_FROM || "noreply@nflpicks.com",
    //   to: options.to,
    //   subject: options.subject,
    //   html: options.html || options.text,
    // });
    
    console.log("[Email] Would send:", options.subject, "to", options.to);
    console.log("[Email] Configure email provider to enable actual email delivery");
    return true;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return false;
  }
}

export async function notifyNewGames(users: User[], games: Game[]): Promise<void> {
  const usersWithEmail = users.filter(
    (u) => u.email && u.emailNotifications
  );

  if (usersWithEmail.length === 0) {
    console.log("[Notifications] No users with email notifications enabled");
    return;
  }

  for (const user of usersWithEmail) {
    const gamesList = games
      .map((g) => `- ${g.awayTeam} @ ${g.homeTeam} (${g.round})`)
      .join("\n");

    await sendEmail({
      to: user.email!,
      subject: `New NFL Playoff Games Posted`,
      text: `Hi ${user.displayName || user.username},\n\nNew playoff games have been posted:\n\n${gamesList}\n\nMake your picks now!`,
      html: `
        <h2>New NFL Playoff Games Posted</h2>
        <p>Hi ${user.displayName || user.username},</p>
        <p>New playoff games have been posted:</p>
        <ul>
          ${games.map((g) => `<li>${g.awayTeam} @ ${g.homeTeam} (${g.round})</li>`).join("")}
        </ul>
        <p><strong>Make your picks now!</strong></p>
      `,
    });
  }
}

export async function notifyGameResults(users: User[], game: Game): Promise<void> {
  const usersWithEmail = users.filter(
    (u) => u.email && u.emailNotifications
  );

  if (usersWithEmail.length === 0) {
    console.log("[Notifications] No users with email notifications enabled");
    return;
  }

  for (const user of usersWithEmail) {
    await sendEmail({
      to: user.email!,
      subject: `Game Results: ${game.awayTeam} @ ${game.homeTeam}`,
      text: `Hi ${user.displayName || user.username},\n\nResults are in!\n\n${game.awayTeam} ${game.awayScore} @ ${game.homeScore} ${game.homeTeam}\n\nCovered the spread: ${game.winner}\n\nCheck the leaderboard to see your standing!`,
      html: `
        <h2>Game Results</h2>
        <p>Hi ${user.displayName || user.username},</p>
        <p>Results are in!</p>
        <h3>${game.awayTeam} ${game.awayScore} @ ${game.homeScore} ${game.homeTeam}</h3>
        <p><strong>Covered the spread: ${game.winner}</strong></p>
        <p>Check the leaderboard to see your standing!</p>
      `,
    });
  }
}
