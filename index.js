var aws = require('aws-sdk');
var nodemailer = require('nodemailer');
const { spawnSync } = require("child_process");
const fsExtra = require('fs-extra');
// const fs = require('fs');

const ses = new aws.SES();
// const ffprobePath = "/opt/bin/ffprobe";
const ffmpegPath = "/opt/bin/ffmpeg";


const createFfmpegParams = (tmpVideoPath, tmpThumbnailPath, targetSecond) => {
    return [
        "-ss", targetSecond,
        "-i", tmpVideoPath,
        "-vf", "thumbnail,scale=1920:1080",
        "-vframes", 1,
        tmpThumbnailPath
    ];
};

const createImageFromVideo = (tmpVideoPath, targetSecond, tmpThumbnailPath) => {
    
    const ffmpegParams = createFfmpegParams(tmpVideoPath, tmpThumbnailPath, targetSecond);
     spawnSync(ffmpegPath, ffmpegParams);

    // return tmpThumbnailPath;
};

exports.handler = (event, context, callback) => {
    // remove all temp files 
    fsExtra.emptyDirSync('/tmp');

    const time = 2
    const tmpThumbnailPath = "/tmp/thumbnail.jpg";
    createImageFromVideo(event.videoLink, time, tmpThumbnailPath);


    var mailOptions = {
        from: 'meskat@live.com',
        subject: event.subject,
        html: event.body,
        to: event.email,
        attachments: [
            {
               path: tmpThumbnailPath
            }
        ]
    };
    
    // Creating SES transporter;
    var transporter = nodemailer.createTransport({
        SES: ses
    });

    transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            callback(null, {"statusCode": 400, "message": "Failed"});
        } else {
            callback(null, {"statusCode": 200, "message": "Success"});
        }
    });
        
};