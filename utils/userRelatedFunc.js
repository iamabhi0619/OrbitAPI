const updateServiceAvailed = async (user, serviceId, serviceName) => {
    const serviceIndex = user.servicesAvailed.findIndex((s) => s.serviceId === serviceId);
    if (serviceIndex > -1) {
        user.servicesAvailed[serviceIndex].lastUsedOn = new Date();
        user.servicesAvailed[serviceIndex].usageCount += 1;
    } else {
        user.servicesAvailed.push({
            serviceId,
            serviceName,
            firstUsedOn: new Date(),
            lastUsedOn: new Date(),
            usageCount: 1,
            status: "active",
        });
    }
};


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

module.exports = { userDataSanitization, updateServiceAvailed };