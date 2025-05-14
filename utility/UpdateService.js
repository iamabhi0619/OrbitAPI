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

module.exports = updateServiceAvailed;
// This function updates the user's service usage history. It checks if the service has been used before and updates the last used date and usage count accordingly. If it's a new service, it adds it to the user's servicesAvailed array with the current date as both first and last used date.