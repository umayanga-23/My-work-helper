# Multi-stage Dockerfile for Spring Boot 3 Backend (Root context)
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /workspace

# Copy Maven wrapper and dependencies specification
COPY Backend/pom.xml Backend/mvnw ./
COPY Backend/.mvn .mvn
RUN chmod +x ./mvnw

# Copy source code and build production jar
COPY Backend/src src
RUN ./mvnw clean package -DskipTests

# Stage 2: Lightweight runtime image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy the built jar from build stage
COPY --from=build /workspace/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar"]
