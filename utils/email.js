const nodemailer = require('nodemailer');

const sendEmail = async options => {
    console.log('inside sendEmail...-->');

    // 1) Create a transporter-------------------------------------


    //-----for GMAIL
    // const transporter = nodemailer.createTransport({
    //     service: 'Gmail',
    //     auth: {
    //         user: process.env.EMAIL_USERNAME,
    //         pass: process.env.EMAIL_PASSWORD
    //     }
    //     //Activate in gmail "less secure app" option
    // });

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // 2)DEFINE the email options
    const mailOptions = {
        from: 'Rohit <rohit@gmail.com>',
        to: options.email,
        subject: options.subject,
        text: options.message
        //html
    };

    // 3)Actually send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;