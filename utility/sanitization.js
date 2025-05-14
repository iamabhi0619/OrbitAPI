const userDataSanitization = (user) => {
    const sanitizedData = {
        _id: user._id,
        role: user.role,
        name: user.name,
        userId: user.userId,
        gender: user.gender,
        avatar: user.avatar,
        email: user.email,
        lastLogin: user.lastLogin,
    };
    return sanitizedData;
}

module.exports = { userDataSanitization };