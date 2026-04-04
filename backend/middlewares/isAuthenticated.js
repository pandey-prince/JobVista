import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
  try {
    // console.log("reached to isAUthenticated");
    // const token = await req.cookies.token;
    // console.log(req.cookies);
    console.log(token);
    if (!token) {
      return res.status(401).json({
        message: "unauthorized",
        success: false,
      });
    }
    const decode = jwt.verify(token, process.env.SECRET_KEY);
    if (!decode) {
      return res.status(401).json({
        message: "Invalid token",
        success: false,
      });
    }

    req.id = decode.userId;
    next();
  } catch (error) {
    console.log(err);
  }
};

export default isAuthenticated;
