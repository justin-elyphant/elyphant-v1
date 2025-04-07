
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleVerificationRequest } from "./handlers/verificationHandler.ts";

console.log("Verify Email Code function loaded");

serve(handleVerificationRequest);
