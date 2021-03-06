import * as mailer from "./email";
import { ServerPreferences, SessionInfo, VerifiedProfile } from "./datamodels";
import { DB, GetSessionCodeResult, SetSessionInfoResult } from "./database";

const db = new DB();

function createVerficationSession(email: string, discord_id: string, server_id: string) {
  let code = generateCode();
  let timestamp = new Date().getTime();
  let session = new SessionInfo(email, discord_id, server_id, code.toString(), timestamp.toString());
  return session;
}

export async function startVerificationProcess(email: string, discord_id: string, server_id: string): Promise<StartVerificationResult> {
  let session = createVerficationSession(email, discord_id, server_id);
  let status = await db.setSessionInfo(session);

  switch (status) {
    case SetSessionInfoResult.SuccessfullyCreated:
    case SetSessionInfoResult.SuccessfullyUpdated: {
      let emailSuccess;
      try {
        emailSuccess = await mailer.sendMail(session.email, session.verification_code);
      } catch (err) {
        await db.deleteSessionsByEmail(session.email, session.server_id);
        return StartVerificationResult.InvalidEmailerLogin;
      }
      if (emailSuccess) {
        return status as unknown as StartVerificationResult;
      } else {
        await db.deleteSessionsByEmail(session.email, session.server_id);
        return StartVerificationResult.ActionFailed;
      }
    }
    case SetSessionInfoResult.SessionAlreadyActive: {
      await db.deleteSessionsByUser(session.discord_id, session.server_id);
      await db.setSessionInfo(session);
      return StartVerificationResult.SessionReset;
    }
    default:
      return status as unknown as StartVerificationResult;
  }
}

export async function validateCode(userCode: string, discord_id: string, server_id: string): Promise<ValidateCodeResult | GetSessionCodeResult> {
  let dbCode = await db.getSessionCode(discord_id, server_id);
  if (dbCode in GetSessionCodeResult) {
    return dbCode as GetSessionCodeResult;
  }

  if (userCode == dbCode.toString()) {
    storeVerifiedEmail(discord_id, server_id);
    return ValidateCodeResult.ValidationSuccess;
  } else {
    return ValidateCodeResult.ValidationFailed;
  };
}

async function storeVerifiedEmail(discord_id: string, server_id: string) {
  let row = await db.getSessionInfo(discord_id, server_id);
  let verifiedProfile = new VerifiedProfile(
    row.email,
    row.discord_id,
    row.server_id,
    row.timestamp,
  );
  await db.setVerifiedUser(verifiedProfile);
  await db.deleteSessionsByEmail(verifiedProfile.email, verifiedProfile.server_id);
};


export async function queryServerPreferences(server_id: string) {
  let serverPrefs = await db.getServerPreferences(server_id);
  return serverPrefs;
}

export function setServerPreferences(ServerPreferences: ServerPreferences) {
  db.setSeverPreferences(ServerPreferences);
}

export async function createServerPreferences(server_id: string): Promise<void> {
  let serverPreferences = await db.getServerPreferences(server_id);
  if (serverPreferences == undefined) {
    await db.setSeverPreferences({
      server_id: server_id,
      domains: "gmail.com",
      prefix: "!",
      cmd_channel: null,
      role_id: null,
    });
  }
}

export async function deleteVerifiedUser(discord_id: string, server_id: string) {
  let row = await db.getVerifiedUser(discord_id, server_id);
  if (row !== undefined) {
    db.deleteVerifiedUser(new VerifiedProfile(
      row.email,
      row.discord_id,
      row.server_id,
      row.timestamp
    ));
  }
}

function generateCode(): number {
  return randomIntFromInterval(100000, 999999);
}

// Generate random integer, within min and max included range
function randomIntFromInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export enum ValidateCodeResult {
  ValidationSuccess = "ValidationSuccess",
  ValidationFailed = "ValidationFailed",
}

// extends SetSessionInfoResult
export enum StartVerificationResult {
  ServerMemberAlreadyVerified,
  EmailAlreadyTaken,
  SuccessfullyCreated,
  SessionReset,
  SuccessfullyUpdated,
  ActionFailed,
  InvalidEmailerLogin
}
