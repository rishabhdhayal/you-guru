import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import React, { useRef, useState, useEffect } from "react";
import backend from "@tensorflow/tfjs-backend-webgl";
import Webcam from "react-webcam";

import "./testing.css";
import DropDown from "../../components/DropDown/index";
import { poseImages } from "../../utils/pose_images";
import { POINTS, keypointConnections } from "../../utils/data";
import { drawPoint, drawSegment } from "../../utils/helper";
import { Link } from "react-router-dom";

let interval;
let count = 0;

let pose_color = "rgb(255,255,255)";
let poseList = [
    "Tree",
    "Chair",
    "Cobra",
    "Warrior",
    "Dog",
    "Shoulderstand",
    "Traingle",
];

const CLASS_NO = {
    Chair: 0,
    Cobra: 1,
    Dog: 2,
    No_Pose: 3,
    Shoulderstand: 4,
    Traingle: 5,
    Tree: 6,
    Warrior: 7,
};

let Flag = false;

const FACING_MODE_USER = "user";
const FACING_MODE_ENVIRONMENT = "environment";




function Testing() {
    async function initializeTensorFlow() {
        await tf.ready();
        // Now you can load your model and perform other operations.
    }

    initializeTensorFlow();

    const webcamRef = useRef(null);
    const canvasRef = useRef(null);

    const [startingTime, setStartingTime] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [poseTime, setPoseTime] = useState(0);
    const [bestPerform, setBestPerform] = useState(0);
    const [currentPose, setCurrentPose] = useState("Tree");
    const [isStartPose, setIsStartPose] = useState(false);



    const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);

    // =======================================================================================

    function get_center_point(landmarks, left_bodypart, right_bodypart) {
        let left = tf.gather(landmarks, left_bodypart, 1);
        let right = tf.gather(landmarks, right_bodypart, 1);
        const center = tf.add(tf.mul(left, 0.5), tf.mul(right, 0.5));
        return center;
    }

    function get_pose_size(landmarks, torso_size_multiplier = 2.5) {
        let hips_center = get_center_point(
            landmarks,
            POINTS.LEFT_HIP,
            POINTS.RIGHT_HIP
        );
        let shoulders_center = get_center_point(
            landmarks,
            POINTS.LEFT_SHOULDER,
            POINTS.RIGHT_SHOULDER
        );
        let torso_size = tf.norm(tf.sub(shoulders_center, hips_center));
        let pose_center_new = get_center_point(
            landmarks,
            POINTS.LEFT_HIP,
            POINTS.RIGHT_HIP
        );
        pose_center_new = tf.expandDims(pose_center_new, 1);

        pose_center_new = tf.broadcastTo(pose_center_new, [1, 17, 2]);
        // return: shape(17,2)
        let d = tf.gather(tf.sub(landmarks, pose_center_new), 0, 0);
        let max_dist = tf.max(tf.norm(d, "euclidean", 0));

        // normalize scale
        let pose_size = tf.maximum(
            tf.mul(torso_size, torso_size_multiplier),
            max_dist
        );
        return pose_size;
    }

    function normalize_pose_landmarks(landmarks) {
        let pose_center = get_center_point(
            landmarks,
            POINTS.LEFT_HIP,
            POINTS.RIGHT_HIP
        );
        pose_center = tf.expandDims(pose_center, 1);
        pose_center = tf.broadcastTo(pose_center, [1, 17, 2]);
        landmarks = tf.sub(landmarks, pose_center);

        let pose_size = get_pose_size(landmarks);
        landmarks = tf.div(landmarks, pose_size);
        return landmarks;
    }

    // ===============================================



    function rotateCam() {
        if (prevState === FACING_MODE_ENVIRONMENT) {
          document.getElementById('webcam').style.transform = 'rotateY(0deg)';
          document.getElementById('my-canvas').style.transform = 'rotateY(0deg)';
        };
          // document.getElementById('dropdown').style.marginTop = '0px';
        elseif (prevState === FACING_MODE_ENVIRONMENT) 
        {
          document.getElementById('webcam').style.transform = 'rotateY(180deg)';
          document.getElementById('my-canvas').style.transform = 'rotateY(180deg)';
          // document.getElementById('dropdown').style.marginTop = '250px';
        }}


    const videoConstraints = {
        facingMode: FACING_MODE_USER
      };


    const [facingMode, setFacingMode] = React.useState(FACING_MODE_USER);
      

    const handleClick = React.useCallback(() => {
        setFacingMode(
          prevState =>
            prevState === FACING_MODE_USER
              ? FACING_MODE_ENVIRONMENT
              : FACING_MODE_USER
        );
        rotateCam();
      }, []);

    // ===============================================

    const runMovenet = async () => {
        const detectorConfig = {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
        };
        const detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            detectorConfig
        );
        const poseClassifier = await tf.loadLayersModel(
            "https://models.s3.jp-tok.cloud-object-storage.appdomain.cloud/model.json"
        );

        interval = setInterval(() => {
            detectPose(detector, poseClassifier);
        }, 100);
    };

    function landmarks_to_embedding(landmarks) {
        // normalize landmarks 2D
        landmarks = normalize_pose_landmarks(tf.expandDims(landmarks, 0));
        let embedding = tf.reshape(landmarks, [1, 34]);
        return embedding;
    }


   
      

   

    const detectPose = async (detector, poseClassifier) => {
        let notDetected = 0;
        const video = webcamRef.current.video;
        const pose = await detector.estimatePoses(video);
        const keypoints = pose[0].keypoints;
        // let connections = keypointConnections[keypoints.name];
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        // console.log(keypoints[5])
        let left_shoulder = keypoints[5];
        let right_shoulder = keypoints[6];


        const videoHeight = video.videoHeight
        const videoWidth = video.videoWidth

        try {
            const keypoints = pose[0].keypoints;
            let input = keypoints.map((keypoint) => {
                // Function to be executed for each keypoint
                if (
                    keypoint.score > 0.4 &&
                    keypoint.name !== "left_ear" &&
                    keypoint.name !== "right_ear"
                ) {
                    drawPoint(ctx, keypoint.x, keypoint.y, 8, pose_color);

                    drawPoint(
                        ctx,
                        (left_shoulder.x + right_shoulder.x) / 2,
                        (left_shoulder.y + right_shoulder.y) / 2,
                        8,
                        pose_color
                    );
                    drawSegment(
                        ctx,
                        [
                            (left_shoulder.x + right_shoulder.x) / 2,
                            (left_shoulder.y + right_shoulder.y) / 2,
                        ],
                        [keypoints[0].x, keypoints[0].y],
                        pose_color
                    );

                    let connections = keypointConnections[keypoint.name];

                    try {
                        connections.forEach((connection) => {
                            let conName = connection.toUpperCase();
                            drawSegment(
                                ctx,
                                [keypoint.x, keypoint.y],
                                [keypoints[POINTS[conName]].x, keypoints[POINTS[conName]].y],
                                pose_color
                            );
                        });
                    } catch (err) { }
                }

                // console.log(keypoint.name, count)
                count += 1;
                return [keypoint.x, keypoint.y];
            });

            //   console.log(input.shape)

            const processedInput = landmarks_to_embedding(input);
            const classification = poseClassifier.predict(processedInput);
            classification.array().then((data) => {
                const classNo = CLASS_NO[currentPose];
                // console.log(data[0][classNo], currentPose);

                if (data[0][classNo] > 0.95) {
                    pose_color = "rgb(0,255,0)";
                    console.log(currentPose);
                }
                if (data[0][classNo] < 0.95) {
                    pose_color = "rgb(255,255,255)";
                }
            });

            // console.log(video.videoWidth); // Set video width
            // console.log(video.videoHeight); // Set video height
            if (video) {
                setVideoWidth(video.videoWidth);
                setVideoHeight(video.videoHeight);
              }           
      
            // const pose = await detector.estimatePoses(video);
            // const keypoints = pose[0].keypoints;
            // const ctx = canvasRef.current.getContext('2d');
            // ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);








        } catch (error) { }
    };

    function startYoga() {
        setIsStartPose(true);
        runMovenet();
        // document.getElementsById('drop_down').style.display = 'none';
    }

    function stopPose() {
        setIsStartPose(false);
        clearInterval(interval);
        // document.getElementsById('drop_down').style.display = 'block';
    }

    if (isStartPose) {
        return (
            <div>
                <div className="home-container">
                    <div className="home-header">
                        <h1 className="home-heading">Yog Guru</h1>
                        <h1 className="home-heading">{currentPose}</h1>
                        {/* <h1 className="home-heading"></h1> */}
                        <div className=" drop_down" id="drop_down">
                            {/* <DropDown
                                poseList={poseList}
                                currentPose={currentPose}
                                setCurrentPose={setCurrentPose}
                            /> */}
                        </div>
                    </div>
                    <div className="main-div">
                        <div className="selected-pose">
                            <img src={poseImages[currentPose]} alt="" />
                        </div>
                        <div className="canvas"  style={{height:{videoHeight}}}>
                            <Webcam
                                // width={videoWidth}
                                // height={videoHeight}
                                id="webcam"
                                ref={webcamRef}
                                videoConstraints={{
                                    ...videoConstraints,
                                    facingMode
                                  }}
                                style={{
                                    position: "relative",
                                    maxHeight: {videoHeight},
                                    minHeight:{videoHeight},
                                    maxWidth: '100%',
                                    display: "inline",
                                    // left: 0,
                                    // top: 100,
                                    padding: "0px",
                                    right: '-50%',
                                }}
                            />
                            <canvas
                            className="canvas-img"
                                ref={canvasRef}
                                id="my-canvas"
                                width={videoWidth}
                                height={videoHeight}
                                style={{
                                    // minHeight:{videoHeight},
                                    // border: "1px solid red",
                                    position: "relative",
                                    display: "inline",
                                    maxHeight: {videoHeight},
                                    minHeight:{videoHeight},
                                    maxWidth: '100%',
                                    left: '-50%' ,
                                    // border: '1px solid blue',
                                }}
                            ></canvas>
                        </div>
                    </div>




                    <div className="testing-btn ">
                        <button onClick={stopPose} className="tsecondary-btn hbtn">
                            Stop Camera
                        </button>
                        <button onClick={handleClick }   className="tsecondary-btn hbtn"> Switch Camera </button>
                    </div>
                    <div>
                    {/* <p>Video Width: {videoWidth}</p> */}
                    <p></p>
          {/* <p>Video Height: {videoHeight}</p> */}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="home-container">
            <div className="home-header">
                <h1 className="home-heading yogguru">
                    <Link to={"/"} style={{ color: "black", textDecorationLine: "none" }}>
                        Yog Guru
                    </Link>
                </h1>
                <h1 className="home-heading">{currentPose}</h1>
                <h1 className="home-heading"></h1>
                <div className=" drop_down" id="drop_down">
                    <DropDown
                        poseList={poseList}
                        currentPose={currentPose}
                        setCurrentPose={setCurrentPose}
                    />
                </div>
            </div>
            <div className="main-div">
                <div className="selected-pose">
                    <img src={poseImages[currentPose]} alt="" />
                </div>
                <div className="canvas"></div>
            </div>
            <div className="testing-btn ">
                <button onClick={startYoga} className="tsecondary-btn hbtn">
                    Start Camera
                </button>
            </div>

        </div>
    );
}

export default Testing;
// export default stopPose();
