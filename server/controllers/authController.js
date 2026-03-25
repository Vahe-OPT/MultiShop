import prisma from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ message: "Email already in use" });
  }
  const hashedPassword = await bcrypt.hash(password, 13);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role },
  });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (!existingUser) {
    return res.status(400).json({ message: "User Not Found!" });
  }

  const isMatch = await bcrypt.compare(password, existingUser.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  const token = jwt.sign(
    { id: existingUser.id, role: existingUser.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );

  res.status(200).json({
    token,
    user: {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
    },
  });
};
