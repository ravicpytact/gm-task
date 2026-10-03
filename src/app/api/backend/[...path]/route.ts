import { forwardToBackend } from "@/lib/auth/backend-proxy";

// Every backend call from the browser comes through here (FE-AUTH-002).
export {
  forwardToBackend as DELETE,
  forwardToBackend as GET,
  forwardToBackend as PATCH,
  forwardToBackend as POST,
  forwardToBackend as PUT,
};
