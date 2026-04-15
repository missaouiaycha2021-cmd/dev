pipeline {
  agent any

  environment {
    BACKEND_IMAGE  = "aycha123/mon-dashboard-backend"
    FRONTEND_IMAGE = "aycha123/mon-dashboard-frontend"
    IMAGE_TAG      = "v${BUILD_NUMBER}"
  }

  stages {

    // ================= CHECKOUT =================
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    // ================= VERIFY TOOLS =================
    stage('Check Tools') {
      steps {
        sh '''
          echo "Checking versions..."
          python3 --version || true
          node --version || true
          docker --version || true
        '''
      }
    }

    // ================= INSTALL =================
    stage('Install Dependencies') {
      parallel {

        stage('Backend') {
          steps {
            dir('backend') {
              sh 'pip install -r requirements.txt'
            }
          }
        }

        stage('Frontend') {
          steps {
            dir('frontend') {
              sh '''
                # Charger NVM proprement
                export NVM_DIR="$HOME/.nvm"
                if [ -s "$NVM_DIR/nvm.sh" ]; then
                  . "$NVM_DIR/nvm.sh"
                else
                  echo "NVM not found ❌"
                  exit 1
                fi

                nvm install 20
                nvm use 20

                node --version
                npm install
              '''
            }
          }
        }

      }
    }

    // ================= BUILD FRONTEND =================
    stage('Build Frontend') {
      steps {
        dir('frontend') {
          sh '''
            export NVM_DIR="$HOME/.nvm"
            . "$NVM_DIR/nvm.sh"

            nvm use 20
            npm run build
          '''
        }
      }
    }

    // ================= DOCKER BUILD =================
    stage('Build Docker Images') {
      parallel {

        stage('Backend') {
          steps {
            sh 'docker build -t $BACKEND_IMAGE:$IMAGE_TAG backend/'
          }
        }

        stage('Frontend') {
          steps {
            sh 'docker build -t $FRONTEND_IMAGE:$IMAGE_TAG frontend/'
          }
        }

      }
    }

    // ================= LOGIN =================
    stage('Docker Login') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub',
          usernameVariable: 'USER',
          passwordVariable: 'PASS'
        )]) {
          sh 'echo $PASS | docker login -u $USER --password-stdin'
        }
      }
    }

    // ================= PUSH =================
    stage('Push Images') {
      parallel {

        stage('Backend') {
          steps {
            sh 'docker push $BACKEND_IMAGE:$IMAGE_TAG'
          }
        }

        stage('Frontend') {
          steps {
            sh 'docker push $FRONTEND_IMAGE:$IMAGE_TAG'
          }
        }

      }
    }

    // ================= DEPLOY =================
    stage('Deploy') {
      steps {
        sh '''
          docker compose down || true
          docker compose up -d
        '''
      }
    }

  }

  // ================= POST =================
  post {
    success {
      echo 'CI/CD SUCCESS 🚀'
    }
    failure {
      echo 'CI/CD FAILED ❌'
    }
    always {
      sh 'docker logout || true'
      cleanWs()
    }
  }
}