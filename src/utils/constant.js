const cookieOptions = {
    httpOnly :true,
    secure : process.env.NODE_ENV === "production",
    sameSite : "lax",
    maxAge: 15 * 24 * 60 * 60 * 1000,
}

module.exports = {cookieOptions}