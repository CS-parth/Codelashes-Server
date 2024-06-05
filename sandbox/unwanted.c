#include <stdio.h>
#include <stdlib.h>

int main() {
    // Attempt to read a sensitive file
    FILE *fp;
    char buffer[256];

    fp = fopen("/etc/passwd", "r");
    if (fp == NULL) {
        perror("Failed to open /etc/passwd");
        return 1;
    }

    printf("Contents of /etc/passwd:\n");
    while (fgets(buffer, sizeof(buffer), fp) != NULL) {
        printf("%s", buffer);
    }

    fclose(fp);

    // Attempt to create a file in an unauthorized location
    fp = fopen("/unauthorized_write_test.txt", "w");
    if (fp == NULL) {
        perror("Failed to create /unauthorized_write_test.txt");
    } else {
        fprintf(fp, "This should not be allowed!\n");
        fclose(fp);
    }

    // Attempt to consume excessive resources
    size_t size = 1024 * 1024 * 1024; // 1GB
    void *ptr = malloc(size);
    if (ptr == NULL) {
        perror("Failed to allocate memory");
    } else {
        printf("Allocated 1GB of memory.\n");
        free(ptr);
    }

    return 0;
}
