pipeline {
  agent any

  triggers {
    githubPush()   // Déclenchement automatique via webhook GitHub
  }

  environment {
    BACKEND_IMAGE  = "aycha123/mon-dashboard-backend"
    FRONTEND_IMAGE = "aycha123/mon-dashboard-frontend"
    IMAGE_TAG      = "v${BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Check Tools') {
      steps {
        sh '''
          echo "=== Checking tools versions ==="
          python3 --version || true
          node --version || true
          docker --version || true
          docker compose version || true
        '''
      }
    }

    stage('Install Dependencies') {
      parallel {
        stage('Backend') {
          steps {
            dir('backend') {
              sh 'pip install -r requirements.txt --break-system-packages || true'
            }
          }
        }
        stage('Frontend') {
          steps {
            dir('frontend') {
              sh '''
                export NVM_DIR="$HOME/.nvm"
                if [ -s "$NVM_DIR/nvm.sh" ]; then
                  . "$NVM_DIR/nvm.sh"
                else
                  echo "❌ NVM not found" && exit 1
                fi
                nvm install 20 --no-install-recommends || true
                nvm use 20
                npm ci   # Plus rapide et plus fiable que npm install
              '''
            }
          }
        }
      }
    }

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

    stage('Build Docker Images') {
      parallel {
        stage('Backend') {
          steps {
            sh 'docker build -t $BACKEND_IMAGE:$IMAGE_TAG -t $BACKEND_IMAGE:latest backend/'
          }
        }
        stage('Frontend') {
          steps {
            sh 'docker build -t $FRONTEND_IMAGE:$IMAGE_TAG -t $FRONTEND_IMAGE:latest frontend/'
          }
        }
      }
    }

    stage('Docker Login') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub',
          usernameVariable: 'USER',
          passwordVariable: 'PASS'
        )]) {
          sh '''
            echo "=== Logging into Docker Hub ==="
            # Fix pour problème IPv6 (si nécessaire)
            echo "nameserver 8.8.8.8" > /etc/resolv.conf || true
            echo $PASS | docker login -u $USER --password-stdin
          '''
        }
      }
    }

    stage('Push Images') {
      parallel {
        stage('Backend') {
          steps {
            sh 'docker push $BACKEND_IMAGE:$IMAGE_TAG && docker push $BACKEND_IMAGE:latest'
          }
        }
        stage('Frontend') {
          steps {
            sh 'docker push $FRONTEND_IMAGE:$IMAGE_TAG && docker push $FRONTEND_IMAGE:latest'
          }
        }
      }
    }

    stage('Deploy') {
      steps {
        sh '''
          echo "=== Pulling latest images ==="
          docker compose pull || true

          echo "=== Stopping old containers ==="
          docker compose down --remove-orphans || true

          echo "=== Starting new containers ==="
          docker compose up -d --force-recreate

          echo "=== Cleaning unused images ==="
          docker image prune -f
        '''
      }
    }
  }

  post {
    success {
      echo '✅ CI/CD Pipeline SUCCESS 🚀'
    }
    failure {
      echo '❌ CI/CD Pipeline FAILED'
    }
    always {
      sh 'docker logout || true'
      cleanWs()
    }
  }
}