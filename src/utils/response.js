const successResponse = (res , status = 200 , message = "SUCCESS" , data = null) => {
    return res.status(status).json({
        success : true,
        message,
        data
    })
};

const errorResponse = (res , status = 400 , message = "ERROR") => {
    return res.status(status).json({
        success : false,
        message
    })
};

module.exports = {successResponse, errorResponse};