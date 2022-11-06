import passport from "passport";
import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";
import { loginOrSignupWithGoogle } from "../services/authService";

/**
 * Fetches the user info from Google and authenticates User
 *
 * @param req {Object} - Express request object
 * @param res {Object} - Express response object
 * @param next {Function} - Express middleware function
 */
const googleAuthCallback = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const rCalUiUrl = new URL(config.get("services.rCalUi.baseUrl"));

  try {
    return passport.authenticate(
      "google",
      {},
      async (err, accessToken, user) => {
        if (err) {
          logger.error(err);
          return res.boom.unauthorized("User cannot be authenticated");
        }

        const userData = await loginOrSignupWithGoogle(user._json);

        logger.info("google data:: ", {
          accessToken,
          userData,
        });

        // respond with a cookie
        res.cookie(config.get("userAccessToken.cookieName"), "token", {
          domain: rCalUiUrl.hostname,
          expires: new Date(
            Date.now() + config.get("userAccessToken.ttl") * 1000
          ),
          httpOnly: true,
          secure: true,
          sameSite: "lax",
        });

        return res.redirect(rCalUiUrl.href);
      }
    )(req, res, next);
  } catch (err) {
    logger.error(err);

    // Redirect to an error page in case of an error
    return res.redirect(rCalUiUrl.href);
  }
};

// Logs out the user from the device
const logOut = (_req: Request, res: Response): Response => {
  const cookieName = config.get("userAccessToken.cookieName");
  const rdsUiUrl = new URL(config.get("services.rCalUi.baseUrl"));

  res.clearCookie(cookieName, {
    domain: rdsUiUrl.hostname,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });

  return res.json({
    message: "SignOut successful",
  });
};

export { googleAuthCallback, logOut };
