import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'

//req is short for request
export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action')

    console.log(`>>${action}<<`)
    console.log('Action reveived')

    // console.log('Gettinig all the lights in the network')
    // const getLightsResponse = await callPythonFile('get_lights')
    // const getLightsData = JSON.parse(getLightsResponse)
    // const bulbs = getLightsData.bulbs

    const bulbs = [ '192.168.18.168', '192.168.18.167' ]

    console.log(`Bulb ips: ${bulbs}`)

    if(action === 'on') {
      console.log('Turning on lights')
      const turnLightsOnResponse = await callPythonFile('turn_on_lights', bulbs)
      const turnOnLightsData = JSON.parse(turnLightsOnResponse)
      const success = turnOnLightsData.success

      console.log(`Status: ${success}`)

      return NextResponse.json(
        { message: "success",},
        { status: 200 }
      )
    } else if(action === 'off') {
      console.log('Turning off lights')
      const turnLightsOffResponse = await callPythonFile('turn_off_lights', bulbs)
      const turnOffLightsData = JSON.parse(turnLightsOffResponse)
      const success = turnOffLightsData.success

      console.log(`Status: ${success}`)

      return NextResponse.json(
        { message: "success",},
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { message: 'Incorrect action' },
        { status: 500 }
      )
    }
  } catch (error) {
      console.error("Error:", error)
      return NextResponse.json(
        { message: error },
        { status: 500 }
      )
  }
}

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { message: 'This is a post request' },
    { status: 200 }
  );
}

export async function PATCH(req: NextRequest) {
  return NextResponse.json(
    { message: 'This is a patch request' },
    { status: 200 }
  );
}

function callPythonFile(name: string, args: any[] = []): Promise<string> {
  return new Promise((resolve, reject) => {
    // Path to Python executable in your virtual environment
    const venvPythonPath = 'python_scripts/.venv/bin/python';
    
    const scriptArgs = [`python_scripts/${name}.py`, ...args.map(arg => String(arg))];
    const pythonProcess = spawn(venvPythonPath, scriptArgs);

    let output = "";
    let error = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      error += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Python script exited with code ${code}: ${error.trim()}`));
      }
    });
  });
}

// function callPythonFile(name: string, args: any[] = []): Promise<string> {
//   return new Promise((resolve, reject) => {
//     // If no args provided, only the script name will be in scriptArgs
//     const scriptArgs = [`python_scripts/${name}.py`, ...args.map(arg => String(arg))];
//     const pythonProcess = spawn('python3', scriptArgs);

//     let output = "";
//     let error = "";

//     pythonProcess.stdout.on("data", (data) => {
//       output += data.toString();
//     });

//     pythonProcess.stderr.on("data", (data) => {
//       error += data.toString();
//     });

//     pythonProcess.on("close", (code) => {
//       if (code === 0) {
//         resolve(output.trim());
//       } else {
//         reject(new Error(`Python script exited with code ${code}: ${error.trim()}`));
//       }
//     });
//   });
// }

// function callPythonFile(name: string): Promise<string> {
//   return new Promise((resolve, reject) => {
//       const pythonProcess = spawn('python3', [`python_scripts/${name}.py`]);

//       let output = "";
//       let error = "";

//       pythonProcess.stdout.on("data", (data) => {
//           output += data.toString(); // Collect output data
//       });

//       pythonProcess.stderr.on("data", (data) => {
//           error += data.toString(); // Collect error data
//       });

//       pythonProcess.on("close", (code) => {
//           if (code === 0) {
//               resolve(output.trim()); // Return output when script exits successfully
//           } else {
//               reject(new Error(`Python script exited with code ${code}: ${error.trim()}`));
//           }
//       });
//   });
// }