import fs from 'fs';
import * as path from 'path';

export const IS_WINDOWS = process.platform === 'win32';
export const IS_DARWIN = process.platform === 'darwin';
export const IS_LINUX = process.platform === 'linux';
export const PLATFORM_WINDOWS = 'win32';
export const PLATFORM_DARWIN = 'darwin';
export const PLATFORM_LINUX = 'linux';
export const PLATFORM = process.platform;
export const ARCH = process.arch;

export function deleteFolderRecursive(directoryPath: string) {
  if (fs.existsSync(directoryPath)) {
    // core.info(`Wipping directory ${directoryPath}`);
    fs.readdirSync(directoryPath).forEach((file, index) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}

export const QT_IFW_INSTALL_SCRIPT_QS = `
function Controller() {
  installer.autoRejectMessageBoxes();

  // silent install is not an option until QtIFW v3.0.1
  gui.setSilent(true);

  installer.setMessageBoxAutomaticAnswer("OverwriteTargetDirectory",
                                         QMessageBox.Yes);

  installer.installationFinished.connect(function() {
    gui.clickButton(buttons.NextButton);
  });
  // Uninstaller
  installer.uninstallationFinished.connect(function() {
    gui.clickButton(buttons.NextButton);
  });
}

function logCurrentPage() {
    var pageName = gui.currentPageWidget().objectName;
    var pagePrettyTitle = gui.currentPageWidget().title;
    console.log("At page: " + pageName + " ('" + pagePrettyTitle + "')");
}

Controller.prototype.IntroductionPageCallback = function() {
  console.log("---- INTRODUCTION PAGE");
  logCurrentPage();
  gui.clickButton(buttons.NextButton);
};

// Unused
//Controller.prototype.WelcomePageCallback = function() {
  //console.log("---- WELCOME PAGE");
  //logCurrentPage();
  //// click delay because the next button is initially disabled for ~1s
  //gui.clickButton(buttons.NextButton, 3000);
//};

//Controller.prototype.CredentialsPageCallback = function() {
  //console.log("---- CREDENTIAL PAGE");
  //logCurrentPage();
  //gui.clickButton(buttons.NextButton);
//};

Controller.prototype.TargetDirectoryPageCallback = function()
{
  console.log("---- TARGET DIRECTORY PAGE");
  logCurrentPage();

  console.log("User-suplied TargetDir: " + installer.value("TargetDir"));

  // gui.currentPageWidget().TargetDirectoryLineEdit.setText(installer.value("harcoded/path/EnergyPlus");
  console.log("Target dir: " +
              gui.currentPageWidget().TargetDirectoryLineEdit.text);

  gui.clickButton(buttons.NextButton);
};


Controller.prototype.LicenseAgreementPageCallback = function() {
  console.log("---- LICENSE AGREEMENT PAGE");
  logCurrentPage();
  var widget = gui.currentPageWidget();
  if (widget != null) {
    console.log("Accepting license");
    var accept = widget.AcceptLicenseRadioButton;
    if (accept != null) {
      console.log("Accepting license: checking Radio button");
      accept.setChecked(true);
    } else {
      // QTIFW >= 4.1.0
      var accept = widget.AcceptLicenseCheckBox;
      if (accept != null) {
        console.log("Accepting license: checking Checkbox button");
        accept.setChecked(true);
      }

      console.log("Accepting license: button does not exist?!");
    }
  }
  gui.clickButton(buttons.NextButton);
};

Controller.prototype.StartMenuDirectoryPageCallback = function() {
  console.log("---- START MENU DIRECTORY PAGE");
  logCurrentPage();

  // You won't get in this callback if it wasn't already Windows, but let's be explicit & safe
  if (systemInfo.kernelType == "winnt") {
    // TODO: extra logging for debug for now
    console.log("installer StartMenuDir: " + installer.value("StartMenuDir"));
    console.log("Text: " + gui.currentPageWidget().StartMenuPathLineEdit.text);
    console.log("AllUsersStartMenuProgramsPath: " + installer.value("AllUsersStartMenuProgramsPath"));
    console.log("UserStartMenuProgramsPath: " + installer.value("UserStartMenuProgramsPath"));
    if (installer.value("UseAllUsersStartMenu") === "true") {
      console.log("Will use the **All** Users Start Menu at: " + installer.value("AllUsersStartMenuProgramsPath"));
    } else {
      console.log("Will use this Users' Start Menu at: " + installer.value("UserStartMenuProgramsPath"));
    }
  }
  gui.clickButton(buttons.NextButton);
};

Controller.prototype.ReadyForInstallationPageCallback = function()
{
  console.log("---- READY FOR INSTALLATION PAGE");
  logCurrentPage();
  gui.clickButton(buttons.CommitButton);
};

Controller.prototype.PerformInstallationPageCallback = function()
{
  console.log("---- PERFORM INSTALLATION PAGE");
  logCurrentPage();
  gui.clickButton(buttons.CommitButton);
};

Controller.prototype.FinishedPageCallback = function() {
  console.log("---- FINISHED PAGE");
  logCurrentPage();

  gui.clickButton(buttons.FinishButton);
};
`;
